var escapeHTML = require('escape-html');
var querystring = require('querystring');
var MailComposer = require("mailcomposer").MailComposer;

var express = require('express');
var anyDB = require('any-db');
var MailParser = require('mailparser').MailParser;
var conn = anyDB.createConnection('sqlite3://addressBook.db');
var app = express();
var xoauth2 = require("xoauth2");
var nodemailer = require('nodemailer');
var http = require('https');

var clientID = '742880991128.apps.googleusercontent.com';
var clientSECRET = 'pHHtB8Hp_0l1C4buGtLB6CCU';
var redirectURI = 'http://ec2-54-86-113-65.compute-1.amazonaws.com/oauth2callback';

var engines = require('consolidate');
app.engine('html', engines.hogan); // tell Express to run .html files through Hogan
app.set('views', __dirname + '/templates'); // tell Express where to find templates
app.use(express.bodyParser());
app.use(express.cookieParser('cookiesecret'));
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
  if (recipientEmail === "" || (recipientEmail.indexOf("@") < 0)) {
    return; 
  }
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


function sendmail(username, refreshtoken, accesstoken, message){
// 	console.log('sending message2');
	console.log('Username: ' + username);
	console.log('Refresh Token: ' + refreshtoken);
	console.log('Access Token: ' + accesstoken);
	console.log('Message: ' + message);
  var transport = nodemailer.createTransport("SMTP", {
    service: 'Gmail', // use well known service
    auth: {
    	XOAuth2: {
        	user: username,
        	//pass: "testPassword",
        	clientId: clientID,
        	clientSecret: clientSECRET,
        	refreshToken: refreshtoken,
        	accessToken: accesstoken,
        	timeout: 3600
        }
    }
  });

  transport.sendMail(message, function(error){
    if(error){
        console.log('Error occured ' + error);
//        sendmail(username, refreshtoken, accesstoken, message);
    }
    else {
      console.log('Message sent successfully!');
    // if you don't want to use this transport object anymore, uncomment following line
    }
  });
}

function deleteUid(uid, imap) {
  try {
    console.log("calling delete"); 
    imap.seq.move(uid, '[Gmail]/Trash', function(err) {
      if (err) { console.log( "imap.seq.move: delete error" + err); }
    }); 
    imap.once('error', function(e){
      console.log("error deleting, waiting then trying again " + err); 
      //setInterval(deleteUid(uid), 5000);

    })
    imap.once('end', function(e){
      return; 
    })
  } catch (err) {
    console.log("error deleting, waiting then trying again " + err); 
    //setInterval(deleteUid(uid), 5000);
  }

}

// function saveDrafts(request){
//   imap = new Imap({
//       user: 'speakyourmail@gmail.com',
//       password: 'testPassword',  host: 'imap.gmail.com',
//       port: 993,
//       tls: true
//     });

function saveDrafts(username, refreshtoken, request, response){
newDraft = 0
loginIMAP(username, refreshtoken, function(imap){
  imap.once('ready', function(){
    console.log("imap ready");
    openEmailBox('[Gmail]/Drafts', imap, function(e, box){
      console.log("draft_id" + request.body.draft_id + " total messages: " + box.messages.total);
      if (request.body.draft_id == box.messages.total) {
	deleteUid(request.body.draft_id, imap); 
      }
      var mailcomposer = new MailComposer(); 
      mailcomposer.setMessageOption({
        from: username, 
        to: request.body.toText, 
        subject: request.body.subjectText, 
        text: request.body.bodyText, 
      });

      var emailString = mailcomposer.buildMessage(function(err, messageSource){
        imap.append(messageSource, {mailbox: '[Gmail]/Drafts'}, function(err){
          if (err) {
              console.log("append error in save: " + err);
              imap.end(); 
//              setTimeout(saveDrafts(request), 3000); 
	      response.send(newDraft); 
          }
          newDraft = box.messages.total;
          console.log("trying to append"+ newDraft);
       	  response.send(newDraft);
	 }); 
      });
    })
  })
  imap.once('error', function(e){
      console.log("error in imap in save: " + e); 
      //saveDrafts(username, refreshtoken, request);
      imap.end();
      //setTimeout(saveDrafts(request), 3000); 
      response.send(newDraft); 
  });
  imap.once('end', function(){
      console.log("saved draft" + newDraft);
      response.send(newDraft);
  });  
  imap.connect(); 
  
  });
}

app.post('/save', function(request, response){
  console.log("saving" +  saveDrafts(request.cookies.username, request.cookies.refreshtoken, request,response));

// loginIMAP(request.cookies.username, request.cookies.refreshtoken, function(imap){
// 
//   imap.once('ready', function(){
//     console.log("imap ready");
//     openEmailBox('INBOX', imap, function(){
//       var mailcomposer = new MailComposer(); 
// 
//       mailcomposer.setMessageOption({
//         from: request.cookies.username, 
//         to: request.body.toText, 
//         subject: request.body.subjectText, 
//         body: request.body.bodyText
//       })
// 
//       var emailString = mailcomposer.buildMessage(function(err, messageSource){
//         console.log("problem is probs with append");
//         imap.append(messageSource, {mailbox: '[Gmail]/Drafts'}, function(err){
//           if (err) {
//               console.log("append error in save: " + err);
//           }
//           console.log("trying to append");
//           imap.end(); 
//         }); 
//       });
//     })
//   })
//   imap.once('error', function(e){
//       console.log("error in imap in save: " + e); 
// 
//   });
//   imap.once('end', function(){
//       console.log("saved draft");
//   });  
//   imap.connect(); 
//   
//   });
}); 

app.post('/sendmail', function(request, response) {
  //console.log(request.body.subjectText + ' ' + request.body.toText + ' ' + request.body.fromText)
  // Create a SMTP transport object
//   from = "speakyourmail@gmail.com";
  from = request.cookies.username;
  // Message object
  var message = {
      // sender info
      from: [from],

      // Comma separated list of recipients
      to: request.body.toText, 

      // Subject of the message
      subject: request.body.subjectText, //
      text: request.body.bodyText,
      html: request.body.bodyText
  };

  sendmail(request.cookies.username, request.cookies.refreshtoken, 
  	request.cookies.accesstoken, message);

  /* 
  adding things to the address book 
  */
  toArray = request.body.toText.split(','); 
  toArray.forEach(function(recipientEmail) {
    addressBookEntry(from, recipientEmail, ""); 
  })

}); 

app.get('/setAddress/:toEmail/:nickname', function(request, response){
  var fromEmail = request.cookies.username; 
  var toEmail = request.params.toEmail; 
  var nickname = request.params.nickname; 
  addressBookEntry(fromEmail, toEmail, nickname); 
  response.send(null); //maybe send whether or not it was added (i.e. if duplicate)
}); 

app.get('/addressBook/:offset', function(request, response){
  var offset = request.params.offset; 
  //AUTH!!!! ORIGINAL EMAIL

  var contacts = '{ "contacts": ['; 
  var myEmail = request.cookies.username;
  q = conn.query(getMostCommonAddresses, [myEmail, 4, offset], function(err, result){
    //TODO if 'result' is undefined (i got this error)
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

//	Mailboxes webpage
app.get('/boxes', function(request, response) {
	response.render('boxes.html');
});

//	IMAP CALL TO RETRIEVE MAILBOXES
function getMailboxes(imap, cb) {
  imap.getBoxes(cb);
}

//	RETRIEVES USER'S MAILBOXES
app.get('/mailboxes', function(request, response) {	

//   imap = new Imap({
//     user: 'speakyourmail@gmail.com',
//     password: 'testPassword',  host: 'imap.gmail.com',
//     port: 993,
//     tls: true
//   });

loginIMAP(request.cookies.username, request.cookies.refreshtoken, function(imap){

	var mailboxes = [];
	imap.once('ready', function() {
		getMailboxes(imap, function(err, boxes) {
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
	
	});
});

//	IMAP CALL TO OPEN MAILBOXE

function openEmailBox(box, imap, cb) {
  try {
    imap.openBox(box, false, cb);
    imap.once('error', function(e){
      console.log("open email box, line 344. " + e); 
    });
  }
  catch(err) {
    console.log("Error opening the email box, possibly too many repeated requsts to server. " + err); 
    imap.end(); 
  }
}

app.get('/email/:boxname/:uid', function(request, response) {
	var uid = request.params.uid;
  var boxname = request.url.split('/')[2]; //get the unparsed url sense it gets unencoded by express
  response.render('read_email.html', {uid: uid, boxname: boxname});
});


app.get('/getemail/:boxname/:uid', function(request, response) {
	loginIMAP(request.cookies.username, request.cookies.refreshtoken, function(imap){
		boxname = request.params.boxname
		uid = request.params.uid;
  		messages = [];
  		imap.once('ready', function() {
    		openEmailBox(boxname, imap, function(err, box) {
      			if (err) throw err;
      			imap.search([uid], function(err, results) {
        			if (err) throw err;
      				var buffer = '';
		try {
        			var f = imap.fetch(results, {
          				bodies: '',
          				struct: true
        			});
        			f.on('message', function(msg, seqno) {
          				var headers='';
          				var uid=0;
          				msg.on('body', function(stream, info) {
            				stream.on('data', function(chunk) {
              					buffer += chunk.toString('utf8');
            				});
          				});
          				msg.once('end', function() {
          					var mailparser = new MailParser();
          					mailparser.on('end', function(mail_object) {
        						messages.unshift({
        							from: mail_object.from[0],
        							subject: mail_object.subject,
        							to: mail_object.to,
        							date: mail_object.date,
        							body: mail_object.html,
								text: mail_object.text
        						});
        						imap.end();
        		  			});
    						mailparser.write(buffer);
    						mailparser.end();              	
          				});
        			});
        			f.once('error', function(err) {
        				imap.end();
        			});
        			f.once('end', function() {
    		  			imap.end();
        			});
		} catch (err) {
			console.log("Caught Error");
			imap.end();
		}
      			});
    		});
  		});
  		imap.once('error', function(err) {
  			response.send(messages);
    		imap.end();
  		});
  		imap.once('end', function() {
  			response.send(messages);
  		});
		imap.connect();
	});
//   imap = new Imap({
//     user: 'speakyourmail@gmail.com',
//     password: 'testPassword',  host: 'imap.gmail.com',
//     port: 993,
//     tls: true,
//   });
//   boxname = request.params.boxname
//   uid = request.params.uid;
//   text='';
//   messages = [];
//   //var num = 1;
//   imap.once('ready', function() {
//     openEmailBox(boxname, function(err, box) {
//       if (err) throw err;
//       
//       imap.search([uid], function(err, results) {
//         if (err) throw err;
//       
//         var buffer = '';
//         try {
//           var f = imap.fetch(results, {
//       //       bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
//             bodies: '',
//             struct: true
//           });
//           f.on('message', function(msg, seqno) {
//             //console.log('Message #%d', seqno);
//             var prefix = '(#' + seqno + ') ';
//             
//             var headers='';
//             var uid=0;
//            
//             msg.on('body', function(stream, info) {
//                //var buffer = '';
//               stream.on('data', function(chunk) {
//                 buffer += chunk.toString('utf8');
//                 console.log('Stream Data Handler');
//               });
//               stream.once('end', function() {
// 
//       			// mailparser.end();
//                 console.log('Stream End Handler');
// 
//                 //console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
//               });
//               console.log('Message Body Handler');
//             });
//             msg.once('attributes', function(attrs) {
//               //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
//               //uid = attrs.uid;
//               console.log('Message Handler Attributes');
//             });
//             msg.once('end', function() {
//             	// num++;
//             	var mailparser = new MailParser();
//             		mailparser.on('end', function(mail_object) {
//           				text =  mail_object.html;
//                   messages.unshift({ //insert first
//           					from: mail_object.from[0],
//           					subject: mail_object.subject,
//           					to: mail_object.to, // a list of 'to' objects (name and address)
//           					date: mail_object.date,
//           					body: mail_object.html, 
//                     text: mail_object.text
//                   });
//           				console.log('ENDING MAILPARSER');
//           				imap.end();
//           		  });
//       			mailparser.write(buffer);
//       			mailparser.end();
//         		console.log('Message Handler End');
//                 	
//             });
//           });
//           f.once('error', function(err) {
//           	imap.end();
//             console.log('Fetch error: ' + err);
//           });
//           f.once('end', function() {
//             console.log('Done fetching all messages!');
//               // mailparser.end();
//               // response.send(text);
//       		  imap.end();
//           });
//         } catch(err){
//           console.log('fetching error');
//           imap.end();
//         }
// 
//       });
//     });
//   });
//   imap.once('error', function(err) {
//   // 	response.send(text);
//   	response.send(messages);
//     //console.log(err);
//     imap.end();
//   });
// 
//   imap.once('end', function() {
//   // 	response.send(text);
//   	response.send(messages);
//   	// response.send(text);
//     //console.log('Connection ended');
//   });
// 
//   imap.connect();

});

app.get('/getemails/:boxname/:pagenum', function(request, response) {
    loginIMAP(request.cookies.username, request.cookies.refreshtoken, function(imap){
       		var boxname = request.params.boxname;
        	var pagenum = request.params.pagenum;
        	var text='';
        	var messages = [];
		var alldata = [];
        	var num = 1;
  			imap.once('ready', function() {
    			openEmailBox(boxname, imap, function(err, box) {
      				if (err) throw err;
                	var f;
                	var remaining = box.messages.total-((pagenum-1)*6);
                	
			alldata.push({
				size: box.messages.total
			});
			if (remaining < 6) {
                        f = imap.seq.fetch(remaining + ':1', {
                        	bodies: '',
                            struct: true
                    	});
//                 	} else {
//                         f = imap.seq.fetch(remaining + ':' + (remaining-5), {
//                             bodies: '',
//                             struct: true
//                     	});
//                 	}
//       				f.on('message', function(msg, seqno) {
//         				var headers='';
//         				var uid=seqno;
// 						var buffer = '';
//         				msg.on('body', function(stream, info) {
//           					stream.on('data', function(chunk) {
//             					buffer += chunk.toString('utf8');
//           					});
//         				});
// 					msg.once('attributes', function(attrs) {
// 						console.log('FLAG: '+attrs.flags);
// 					});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
//         				msg.once('end', function() {
//                 			var mailparser = new MailParser();
//                 			mailparser.on('end', function(mail_object) {
//                             	messages.unshift({
//                             		sender: mail_object.from[0],
//                                 	subject: mail_object.subject,
//                                 	message: mail_object.text,
//                                 	timestamp: mail_object.date,
//                                 	uid: uid,
//                             	});
//                             	num++;
//                 			});
//                         	mailparser.write(buffer);
//                         	mailparser.end();
// 						});
// 					});
//      				f.once('error', function(err) {
//         				console.log('Fetch error: ' + err);
//       				});
//       				f.once('end', function() {
// 						console.log('Done fetching all messages!');
// 						imap.end();
//       				});
//     			});
// <<<<<<< HEAD
//   			});
// 			imap.once('error', function(err) {
// 				alldata.push({
// 					messages: messages
// 				});
// 				response.send(alldata);
// 				console.log("imap error" + err);
// 			});
// 			imap.once('end', function() {
//                                 alldata.push({
//                                         messages: messages
//                 });
// 				response.send(alldata);
// 				console.log('Connection ended');
// 			});
// 			imap.connect();
// 	});
// =======
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
        	var mailparser = new MailParser();
        	mailparser.on('end', function(mail_object) {
    				messages.unshift({
    					sender: mail_object.from[0],
    					subject: mail_object.subject,
    					message: mail_object.text,
              html: mail_object.html,
     					to: mail_object.to,
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
  	
        imap.end();
      });
    });
  			});
			imap.once('error', function(err) {
				alldata.push({
					messages: messages
				});
				response.send(alldata);
				console.log("imap error" + err);
			});
			imap.once('end', function() {
                                alldata.push({
                                        messages: messages
                });
				response.send(alldata);
				console.log('Connection ended');
			});
			imap.connect();
});
	});

app.get('/delete/:boxname/:uid', function(request, response) {

//   imap = new Imap({
//     user: 'speakyourmail@gmail.com',
//     password: 'testPassword',  host: 'imap.gmail.com',
//     port: 993,
//     tls: true,
//   });
console.log("this is calling delete"); 
loginIMAP(request.cookies.username, request.cookies.refreshtoken, function(imap){

  uid = request.params.uid;
  boxname = request.params.boxname;
  console.log(boxname);
  imap.once('ready', function() {
    // open up all of the inboxes
    openEmailBox(boxname, imap, function(err, box) {
      if (err) throw err;
      deleteUid(uid, imap);
/*      imap.seq.move(uid, '[Gmail]/Trash', function(err) {
        if (err) { console.log( "imap.seq.move: delete error" + err); }
      }); */ 
    }); 
  }); 
  imap.once('error', function(err) {
    response.send(null);
    console.log("imap delete error" + err);
  });

  imap.once('end', function() {
    response.send(null);
    console.log('Connection ended in delete');
  });
  imap.connect();
  
  });
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
  //imap = new Imap({
   // user: 'speakyourmail@gmail.com',
   // password: 'testPassword',  host: 'imap.gmail.com',
   // port: 993,
   // tls: true,
 // });

loginIMAP(request.cookies.username, request.cookies.refreshtoken, function(imap){

  imap.once('ready', function() {
    // open up all of the inboxes
    openEmailBox('[Gmail]/Drafts', imap, function(err, box) {
      if (err) {
        console.log("err from compose with opening box: " + err); 
      };
        response.render('compose.html', {boxname: '%5BGmail%5D%2FDrafts', uid: box.messages.total +1,  draft_id: box.messages.total +1});
    });
  });
  imap.once('error', function(err) {
    console.log("imap delete error" + err);
  });

  imap.once('end', function() {
    console.log('Connection ended');
  });
  imap.connect();
	});
});

app.get('/compose/:boxname/:uid', function(request, response) {

	//response.render('compose.html', {boxname: boxname, uid: uid});
  var boxname = request.url.split('/')[2]; //get the unparsed url sense it gets unencoded by express
  var uid = request.params.uid;
//   imap = new Imap({
//     user: 'speakyourmail@gmail.com',
//     password: 'testPassword',  host: 'imap.gmail.com',
//     port: 993,
//     tls: true,
//   });

loginIMAP(request.cookies.username, request.cookies.refreshtoken, function(imap){

  imap.once('ready', function() {
    // open up all of the inboxes
    openEmailBox('[Gmail]/Drafts', imap, function(err, box) {
      if (err) {
        console.log("err from compose with opening box: " + err); 
      };
        response.render('compose.html', {boxname: boxname, uid: uid, draft_id: box.messages.total +1});
    });
  });
  imap.once('error', function(err) {
    console.log("imap delete error" + err);
  });

  imap.once('end', function() {
    console.log('Connection ended');
  });
  imap.connect();
	// var uid = request.params.uid;	
 //  var boxname = request.params.boxname; 
 //  if ('[Gmail]/Drafts' === boxname){
 //    boxname = request.url.split('/')[2]; //get the unparsed url sense it gets unencoded by express
 //    response.render('drafts_compose.html', {boxname: boxname, uid: uid}); 
 //  }else {
 //    response.render('compose.html', {boxname: boxname, uid: uid});
 //  }
	});
});

app.get('/settings', function(request, response) {
	response.render('settings.html');
});

app.get('/keyboard', function(request, response) {
  response.render('keyboard.html');
});

app.get('/username', function(request, response) {
	response.render('username.html');
});

function loginIMAP(user_name, refresh_token, callback) {
	var xoauth2gen = xoauth2.createXOAuth2Generator({
		user: user_name,
		clientId: clientID,
		clientSecret: clientSECRET,
		refreshToken: refresh_token
	});
	xoauth2gen.getToken(function(err, token) {
		if (err) {
			callback(null);
		} else {
	        var imap = new Imap({
                user: user_name,
                xoauth2: token,
                host: 'imap.gmail.com',
                port: 993,
                tls: true
        	});	
        	callback(imap);
    	}
    });
}

app.post('/login', function(request, response) {
	response.cookie('username', request.body.email);
	response.redirect('/');
});

app.get('/oauth2callback', function(request, response) {
	var post_data = querystring.stringify({
		code: request.param('code'),
		client_id: clientID,
		client_secret: clientSECRET,
        redirect_uri: redirectURI,
		grant_type: 'authorization_code'
	});
	var post_options = {
     	host: 'accounts.google.com',
      	path: 'https://accounts.google.com/o/oauth2/token',
      	method: 'POST',
      	headers: {
          	'Content-Type': 'application/x-www-form-urlencoded'
      	}
	};
	var googledata='';
	var post_req = http.request(post_options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			googledata+=chunk;
		});
		res.on('end', function() {
			var data = JSON.parse(googledata);
			if (data.refresh_token != '') {
				response.cookie('accesstoken', data.access_token);
				response.cookie('refreshtoken', data.refresh_token);
				response.redirect('/username');
			}
		});
	});
	post_req.write(post_data);
	post_req.end();
});

app.get('*', function(request, response) {
	if (request.cookies.refreshtoken && request.cookies.username) {
		response.render('inbox.html', {boxname: 'INBOX'});
	} else if (request.cookies.refreshtoken) {
		response.redirect('/username');
	} else {
		response.render('login.html');
	}
});

app.listen(80, function(){
    console.log('- Server listening on port 8080');
});

