var escapeHTML = require('escape-html');
var MailComposer = require("mailcomposer").MailComposer;

var express = require('express');
var anyDB = require('any-db');
var MailParser = require('mailparser').MailParser;
var conn = anyDB.createConnection('sqlite3://addressBook.db');
var app = express();
var xoauth2 = require("xoauth2"),
    xoauth2gen;
var nodemailer = require('nodemailer');


var engines = require('consolidate');
app.engine('html', engines.hogan); // tell Express to run .html files through Hogan
app.set('views', __dirname + '/templates'); // tell Express where to find templates
app.use(express.bodyParser());
app.use('/templates', express.static(__dirname+'/templates'));
app.use('/js', express.static(__dirname+'/js'));
app.use('/style', express.static(__dirname+'/style'));
app.use('/media', express.static(__dirname+'/media'));
app.use('/bootstrap', express.static(__dirname+'/bootstrap'));
app.use('/bootstrap/css', express.static(__dirname+'/bootstrap/css'));
app.use('/bootstrap/fonts', express.static(__dirname+'/bootstrap/fonts'));


var Imap = require('imap'),
    inspect = require('util').inspect;


/*
ADDRESS BOOK SQL STUFF!
*/
var makeAddressBook = "CREATE TABLE IF NOT EXISTS addressBook (clientEmail TEXT, recipientEmail TEXT, recipientNickname TEXT, emailCount INTEGER, PRIMARY KEY (clientEmail, recipientEmail));";
var addSelf = "INSERT INTO addressBook (clientEmail, recipientEmail, recipientNickname, emailCount)"; 
addSelf += "VALUES ("+ "'speakyourmail@gmail.com'" + "," + "'speakyourmail@gmail.com'" + "," + "'me'"+ ", 1);";

var addAddress = "INSERT INTO addressBook (clientEmail, recipientEmail, recipientNickname, emailCount)" + "VALUES ($1, $2, $3, 1);";

var selectAddress = "SELECT recipientEmail, emailCount FROM addressBook WHERE clientEmail = $1 AND recipientEmail = $2";

var updateAddress = "REPLACE INTO addressBook (clientEmail, recipientEmail, recipientNickname,  emailCount) VALUES ($1, $2, $3, $4);";

var getMostCommonAddresses = "SELECT recipientEmail, recipientNickname FROM addressBook WHERE clientEmail = $1 ORDER BY emailCount DESC LIMIT $2 OFFSET $3;";


conn.query(makeAddressBook);
conn.query(addSelf);

function addressBookEntry(clientEmail, recipientEmail, recipientNickname) {
  console.log("addressBook");
  var inDatabase = true; 
  q = conn.query(selectAddress, [clientEmail, recipientEmail]); 
  q.on('row', function(row) {
     //that row exits so update it and add one to the row's count 
     inDatabase = false;  
      conn.query(updateAddress, [clientEmail, recipientEmail, recipientNickname, 1 + parseInt(row['emailCount']) ]); 
      console.log("updating the address");
      
    }); 
  q.on('end', function(){
      if (inDatabase) {
        conn.query(addAddress, [clientEmail,recipientEmail,recipientNickname]); 
        console.log("added a new address " + clientEmail + " recipientEmail: " + recipientEmail);
      }
    }); 
}

/*
END OF ADDRESS BOOK SETUP STUFF
*/



//this is for testing, creates a security issue, but allows local host
app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });


function sendmail(message){
  var transport = nodemailer.createTransport("SMTP", {
    service: 'Gmail', // use well known service
    auth: {
        user: "speakyourmail@gmail.com",
        pass: "testPassword"
    }
  });

  transport.sendMail(message, function(error){
    if(error){
        console.log('Error occured ' + error);
        sendmail(message);
    }
    else {
      console.log('Message sent successfully!');
    // if you don't want to use this transport object anymore, uncomment following line
    }
  });
}

function saveDrafts(request){
  imap = new Imap({
      user: 'speakyourmail@gmail.com',
      password: 'testPassword',  host: 'imap.gmail.com',
      port: 993,
      tls: true
    });

  console.log('calling save');

  imap.once('ready', function(){
    console.log("imap ready");
    openEmailBox('INBOX', function(e){
      var mailcomposer = new MailComposer(); 

      mailcomposer.setMessageOption({
        from: "speakyourmail@gmail.com", 
        to: request.body.toText, 
        subject: request.body.subjectText, 
        body: request.body.bodyText
      })

      var emailString = mailcomposer.buildMessage(function(err, messageSource){
        imap.append(messageSource, {mailbox: '[Gmail]/Drafts', date: "Tue May 06 2014 17:14:51 GMT-0400 (EDT)"}, function(err){
          if (err) {
              console.log("append error in save: " + err);
          }
          console.log("trying to append");
        }); 
      });
    })
  })
  imap.once('error', function(e){
      console.log("error in imap in save: " + e); 
      imap.end();
      saveDrafts(request);
      
  });
  imap.once('end', function(){
      console.log("saved draft");
  });  
  imap.connect(); 
}

app.post('/save', function(request, response){
  saveDrafts(request);
  // imap = new Imap({
  //     user: 'speakyourmail@gmail.com',
  //     password: 'testPassword',  host: 'imap.gmail.com',
  //     port: 993,
  //     tls: true
  //   });

  // console.log('calling save');

  // imap.once('ready', function(){
  //   console.log("imap ready");
  //   openEmailBox('INBOX', function(e){
  //     var mailcomposer = new MailComposer(); 

  //     mailcomposer.setMessageOption({
  //       from: "speakyourmail@gmail.com", 
  //       to: request.body.toText, 
  //       subject: request.body.subjectText, 
  //       body: request.body.bodyText
  //     })

  //     var emailString = mailcomposer.buildMessage(function(err, messageSource){
  //       console.log("problem is probs with append");
  //       imap.append(messageSource, {mailbox: '[Gmail]/Drafts'}, function(err){
  //         if (err) {
  //             console.log("append error in save: " + err);
  //         }
  //         console.log("trying to append");
  //         imap.end(); 
  //       }); 
  //     });
  //   })
  // })
  // imap.once('error', function(e){
  //     console.log("error in imap in save: " + e); 

  // });
  // imap.once('end', function(){
  //     console.log("saved draft");
  // });  
  // imap.connect(); 
}); 

app.post('/sendmail', function(request, response) {
  //console.log(request.body.subjectText + ' ' + request.body.toText + ' ' + request.body.fromText)
  // Create a SMTP transport object
  from = "speakyourmail@gmail.com";
  console.log("calling sendmail to  " + request.body.toText);
  // Message object
  var message = {
      // sender info
      from: [from],

      // Comma separated list of recipients
      to: request.body.toText, 

      // Subject of the message
      subject: request.body.subjectText, //

      text: request.body.bodyText
  };

  sendmail(message);

  /* 
  adding things to the address book 
  */
  toArray = request.body.toText.split(','); 
  toArray.forEach(function(recipientEmail) {
    addressBookEntry(from, recipientEmail, ""); 
  })

}); 

app.get('/setAddress/:email/:toEmail/:nickname', function(request, response){
  var fromEmail = request.params.email; 
  var toEmail = request.params.toEmail; 
  var nickname = request.params.nickname; 
  addressBookEntry(fromEmail, toEmail, nickname); 
}); 

app.get('/addressBook/:offset', function(request, response){
  var offset = request.params.offset; 
  //AUTH!!!! ORIGINAL EMAIL

  var contacts = '{ "contacts": ['; 
  var myEmail = "speakyourmail@gmail.com";
  q = conn.query(getMostCommonAddresses, [myEmail, 4, offset], function(err, result){
    result.rows.forEach(function(row){
        var nickname = row.recipientNickname; 
        contacts += '{"email": "' + row.recipientEmail + '",  "nickname": "' + row.recipientNickname + '"},'; 
    }); 
  });

  q.on('end', function(){
    contacts = contacts.slice(0, -1); 
    contacts += ']}'
    response.json(JSON.parse(contacts)); 
    conn.end();     
    conn = anyDB.createConnection('sqlite3://addressBook.db');
  }); 
});

app.post('/login', function(request, response) {
	response.send(request.body.email + ' ' + request.body.password);
});

//	Mailboxes webpage
app.get('/boxes', function(request, response) {
	response.render('boxes.html');
});

//	IMAP CALL TO RETRIEVE MAILBOXES
function getMailboxes(cb) {
  imap.getBoxes(cb);
}

//	RETRIEVES USER'S MAILBOXES
app.get('/mailboxes', function(request, response) {	

  imap = new Imap({
    user: 'speakyourmail@gmail.com',
    password: 'testPassword',  host: 'imap.gmail.com',
    port: 993,
    tls: true
  });

	var mailboxes = [];
	imap.once('ready', function() {
		getMailboxes(function(err, boxes) {
			var text = '';
			for (var key in boxes) {
				text += key + ',';
			 }
  		mailboxes.push({
  			boxes: text
  		});
			imap.end();
    });
  });
	imap.once('error', function(err) {
  		console.log('Error retrieving mailboxes');
		  response.send(mailboxes);
	});
	imap.once('end', function() {
  		console.log('IMAP connection terminated');
		response.send(mailboxes);
	});
	imap.connect();
	//imap.end();
});

//	IMAP CALL TO OPEN MAILBOXE
function openEmailBox(box, cb) {
  imap.openBox(box, false, cb);
  imap.once('error', function(e){
    console.log("open email box, line 257. " + e); 
    openEmailBox(box,cb);
  });
}

app.get('/email/:boxname/:uid', function(request, response) {
	var uid = request.params.uid;
  var boxname = request.url.split('/')[2]; //get the unparsed url sense it gets unencoded by express
	response.render('read_email.html', {uid: uid, boxname: boxname});
});


app.get('/getemail/:boxname/:uid', function(request, response) {
  imap = new Imap({
    user: 'speakyourmail@gmail.com',
    password: 'testPassword',  host: 'imap.gmail.com',
    port: 993,
    tls: true,
  });
  boxname = request.params.boxname
  uid = request.params.uid;
  text='';
  messages = [];
  //var num = 1;
  imap.once('ready', function() {
    openEmailBox(boxname, function(err, box) {
      if (err) throw err;
      
      imap.search([uid], function(err, results) {
        if (err) throw err;
      
        var buffer = '';
        var f = imap.fetch(results, {
    //       bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
          bodies: '',
          struct: true
        });
        f.on('message', function(msg, seqno) {
          //console.log('Message #%d', seqno);
          var prefix = '(#' + seqno + ') ';
          
          var headers='';
          var uid=0;
         
          msg.on('body', function(stream, info) {
             //var buffer = '';
            stream.on('data', function(chunk) {
              buffer += chunk.toString('utf8');
              console.log('Stream Data Handler');
            });
            stream.once('end', function() {

    			// mailparser.end();
              console.log('Stream End Handler');

              //console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
            });
            console.log('Message Body Handler');
          });
          msg.once('attributes', function(attrs) {
            //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
            //uid = attrs.uid;
            console.log('Message Handler Attributes');
          });
          msg.once('end', function() {
          	// num++;
          	var mailparser = new MailParser();
          		mailparser.on('end', function(mail_object) {
        				text =  mail_object.html;
						    console.log("subject: "+mail_object.subject);
                messages.unshift({ //insert first
        // 					from: mail_object.from[0].name + ' ' + mail_object.from[0].address,
        					from: mail_object.from[0],
        					subject: mail_object.subject,
        					to: mail_object.to, // a list of 'to' objects (name and address)
        					date: mail_object.date,
        					body: mail_object.html
        				});
        				console.log('ENDING MAILPARSER');
        				imap.end();
        		  });
    			mailparser.write(buffer);
    			mailparser.end();
      		console.log('Message Handler End');
              	
          });
        });
        f.once('error', function(err) {
        	imap.end();
          console.log('Fetch error: ' + err);
        });
        f.once('end', function() {
          console.log('Done fetching all messages!');
            // mailparser.end();
            // response.send(text);
    		  imap.end();
        });
        //console.log('Done fetching all messages!');
        //imap.end();
      });
    });
  });
  imap.once('error', function(err) {
  // 	response.send(text);
  	response.send(messages);
    //console.log(err);
    imap.end();
  });

  imap.once('end', function() {
  // 	response.send(text);
  	response.send(messages);
  	// response.send(text);
    //console.log('Connection ended');
  });

  imap.connect();

});

// app.get('/getemails/:boxname', function(request, response) {
app.get('/getemails/:boxname/:pagenum', function(request, response) {
	imap = new Imap({
    	user: 'speakyourmail@gmail.com',
    	password: 'testPassword',  
    	host: 'imap.gmail.com',
    	port: 993,
    	tls: true
	});

  	var boxname = request.params.boxname;
  	var pagenum = request.params.pagenum;
  	var text='';
  	var messages = [];
  	var num = 1;
  imap.once('ready', function() {
    openEmailBox(boxname, function(err, box) {
      if (err) throw err;
    		var f;
    		var remaining = box.messages.total-((pagenum-1)*6);
    		if (remaining < 6) {
    			f = imap.seq.fetch(remaining + ':1', {
      			bodies: '',
      			struct: true
    			});
    		} else {
    			f = imap.seq.fetch(remaining + ':' + (remaining-5), {
      			bodies: '',
      			struct: true
    			});      		
    		}

      f.on('message', function(msg, seqno) {
        //console.log('Message #%d', seqno);
        var prefix = '(#' + seqno + ') ';
        
        var headers='';
        var uid=seqno;

      	var buffer = '';      
        msg.on('body', function(stream, info) {
           //var buffer = '';
          stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', function() {
            //console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
          });
        });
        msg.once('attributes', function(attrs) {
          //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
          //uid = attrs.uid;
        });
        msg.once('end', function() {
        	  
  //           	headers = Imap.parseHeader(buffer);    	
  //       	  	messages.push({
  //         		from: headers.from,
  //         		to: headers.to,
  //         		subject: headers.subject,
  //         		date: headers.date,
  //         		uid: uid
  //         	});
  //          	num++;
           	
        	var mailparser = new MailParser();
        	mailparser.on('end', function(mail_object) {
            console.log("subject: "+mail_object.subject + "date: " + mail_object.date);
    				messages.unshift({
    					sender: mail_object.from[0].name,
    					subject: mail_object.subject,
    					message: mail_object.text,
    // 					to: mail_object.to[0].name,
    					timestamp: mail_object.date,
    					uid: uid
    				});
    				num++;
      		});
  			mailparser.write(buffer);
  			mailparser.end();
        	
          //console.log(prefix + 'Finished');
        });
      });
      f.once('error', function(err) {
        console.log('Fetch error: ' + err);
      });
      f.once('end', function() {
      // response.send(messages);
        console.log('Done fetching all messages!');
        
  // 	messages.unshift({
  //     	size: num
  //     });
  // 	response.send(messages);
  	
        imap.end();
      });
    });
  });

  imap.once('error', function(err) {
  // 	messages.unshift({
  //     	size: num
  //     });
  	response.send(messages);
    console.log("imap error" + err);
  	// response.send(messages);
  });

  imap.once('end', function() {
  // 	messages.unshift({
  //     	size: num
  //     });
  	response.send(messages);
    console.log('Connection ended');
  // 	response.send(messages);
  });

  imap.connect();
});

app.get('/delete/:boxname/:uid', function(request, response) {

  imap = new Imap({
    user: 'speakyourmail@gmail.com',
    password: 'testPassword',  host: 'imap.gmail.com',
    port: 993,
    tls: true,
  });

  uid = request.params.uid;
  boxname = request.params.boxname;
  console.log(boxname);
  imap.once('ready', function() {
    // open up all of the inboxes
    openEmailBox(boxname, function(err, box) {
      if (err) throw err;
      imap.seq.move(uid, '[Gmail]/Trash', function(err) {
        if (err) { console.log( "imap.seq.move: delete error" + err); }
      }); 
    });
  });
  imap.once('error', function(err) {
  //  messages.unshift({
  //      size: num
  //     });
    response.send(null);
    console.log("imap delete error" + err);
    // response.send(messages);
  });

  imap.once('end', function() {
  //  messages.unshift({
  //      size: num
  //     });
    response.send(null);
    console.log('Connection ended');
  //  response.send(messages);
  });
  imap.connect();
});

app.get('/box/:boxname', function(request, response) {
	var boxname = request.params.boxname;
// 	console.log('Box:' + boxname + ':Box');
	response.render('box.html', {boxname: boxname});
});

app.get('/inbox', function(request, response) {
	response.render('inbox.html', {boxname: 'INBOX'});
});

app.get('/drafts', function(request, response) {
  response.render('drafts.html', {boxname:'%5BGmail%5D%2FDrafts'});
});
app.get('/compose', function(request, response) {
  response.render('compose.html');
});

app.get('/compose/:boxname/:uid', function(request, response) {
	var uid = request.params.uid;	
  var boxname = request.params.boxname; 
	response.render('compose.html', {boxname: boxname, uid: uid});
});

app.get('/settings', function(request, response) {
	response.render('settings.html');
});

app.get('/keyboard', function(request, response) {
  response.render('keyboard.html');
});

app.get('/home', function(request, response) {
	response.render('home.html');
});

app.get('*', function(request, response) {
// 	response.render('home.html');
// 	response.render('main.html');
	response.render('inbox.html', {boxname: 'INBOX'});
});

app.listen(8080, function(){
    console.log('- Server listening on port 8080');
});