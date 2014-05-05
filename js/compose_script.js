var recipients = [];

/* ON LOAD */
$(window).load(function() {
	console.log("COMPOSE LOADING uid: "+meta('uid'));
	if(meta('uid')!='') {
		get_reply_data(function(subjText) {
			if(subjText && subjText.length > 30) {
				subjText = subjText.substring(0, 30 + "...");
			}
			var header = "Inbox";
	        if(document.referrer.indexOf("drafts") > -1) {
	            header = "Drafts";
	        }
	        if(subjText) {
	            header += " > " + subjText;
	        }
	        else {
	            header += " > Read Message";
	        }
	        header += " > Reply";
	        $('#pathHeader').text(header);

	        showHideScrollArrows();
		});
	}
	else {
		$('#pathHeader').text('Compose');
	}
});

$("#write").on('change keyup paste', function() {
	showHideScrollArrows();
});

$('#hideKeyboard').on('click', function() {

});

$("#group2group1group1group1").on('change keyup paste', function() {
	console.log("keyup");
    this.style.height = 0;
    this.style.height = this.scrollHeight + 'px';
});



function get_reply_data(callback) {   
	//console.log("REQUESTING REPLY DATA FOR  "+meta('boxname')+'/'+meta('uid'));
    make_request('http://localhost:8080/getemail/' + meta('boxname')+'/'+meta('uid'), function(e) {
        if (this.status == 200) {    
			var content = this.responseText;
			var data = JSON.parse(content);

			$("#from").html();
			$("#to").html(data[0].from);
			$("#subjectText").html("Re: " + data[0].subject);
   //         //TODO get plain text, put in box	
   //         
   			console.log("REPLYING TO ");
   			//console.log(data[0].body);
   			$("#replyText").html(data[0].body);

			var plainText = jQuery('<div>').html(data[0].body).text();

			$('#write').val('\n\n\n-----\n'+plainText);
			$('#write').selectRange(0);
			callback(data[0].subject);
        }
        else {
            alert("Feed Request was invalid.");
        }               
    });
}


// when window is resized, check again if you need arrows
$(window).bind('resize', function() {
    showHideScrollArrows();
});


function submitEmail() {
	var mainform = document.getElementById('mainform');
	mainform.submit();
}

function deleteMessage(inboxmsg) {
    make_request('http://localhost:8080/delete/' + $(inboxmsg).attr('uid'), function(e) {
        console.log("Message" + $(inboxmsg).attr('uid') + " deleted");
    }); 
    //window.location.href = document.referrer;

}

function saveDraft(msg){
	var request = new XMLHttpRequest();
    url = 'http://localhost:8080/save';
    request.open('POST', url, true);
   	request.setRequestHeader('Content-Type', "application/json"); 
   	var emailString = '';
   	recipients.forEach(function(x){
   		emailString += x.email + ','; 
   	});
   	emailString = emailString.slice(0,-1);
    request.send(JSON.stringify({
    	"toText": emailString,
    	"subjectText": document.getElementById("subjectText").value,
    	"bodyText": document.getElementById("write").value
    }));
    //window.location.href = "http://localhost:8080/inbox";
}


function sendMail(msg){
    var request = new XMLHttpRequest();
    url = 'http://localhost:8080/sendmail';
    request.open('POST', url, true);
   	request.setRequestHeader('Content-Type', "application/json"); 
   	var emailString = '';
   	recipients.forEach(function(x){
   		emailString += x.email + ','; 
   	});
   	emailString = emailString.slice(0,-1);
    request.send(JSON.stringify({
    	"toText": emailString,
    	"subjectText": document.getElementById("subjectText").value,
    	"bodyText": document.getElementById("write").value
    }));
    window.location.href = "http://localhost:8080/inbox";
    //return request;
}


/* recipients obj */
function Recipient(nickname, email) {
	this.nickname = nickname;
	this.email = email;
}

function expandToSelection(){
	console.log("selecting");
	pageNumber = 0; //this is what page you are on

	var offset = 0 + parseInt(pageNumber);
	url = 'http://localhost:8080/addressBook/' + offset; 
    make_request(url, function(e) {
    	var content = this.responseText; 
		console.log(content);
		var abook = JSON.parse(content); 
		abook = abook['contacts'];
		console.log(abook)
		var count = 0; 
		var recipient = $( ".recipient" );
		for (var i = 0; i < recipient.length && i < abook.length; i++) {
			if (abook[i]['nickname'] != ""){
				recipient[i].innerHTML = abook[i]['nickname']; 
			} else {
				recipient[i].innerHTML = abook[i]['email']; 
			}
		};

		var emails = $( ".email-address" ); 
		for (var i = 0; i < emails.length && i < abook.length; i++) {
			if (abook[i]['nickname'] != ""){
				emails[i].innerHTML = abook[i]['email']; 
			} else {
				emails[i].innerHTML = abook[i]['email']; 
			}
		};
    }); 

    $('#recipientBoxRow').removeClass('hide');
    // remove hide from all descendants
    $('#recipientBoxRow').find('.hide').removeClass('hide');

    $('.seePrevRecip').addClass('hide'); //no prevs to start with
    // set id to id of seePrevRecip
    var newID = $('.seePrevRecip').attr('id');
    newID = newID.substring(0, newID.length-1);
    id = newID;
    groupNumber = 0;
}

function goBackClicked() {
    // if recipients are visible, hide
    if(!$('#recipientBoxRow').hasClass('hide')) {
        $('#recipientBoxRow').addClass('hide');
    }
}

function toggleRecipient(obj) {
	var name = $(obj).text().trim();
	var addr = $(obj).parent().find('.email-address').text();
	// if no email address, name is email address
	if(addr === "") {
		addr = name;
	}
	var thisRecipient = new Recipient(name, addr);
	console.log('toggling: '+thisRecipient.email);

	//ALREADY IN LIST
	if($(obj).find('.recipient').hasClass('active')) {
		$(obj).find('.recipient').removeClass('active');
		removeRecipient(thisRecipient.email);
	}
	else { //NOT ALREADY IN LIST
		$(obj).find('.recipient').addClass('active');
		recipients.push(thisRecipient);
	}

	// make recipients list into comma-separated string
	var recipString = "";
	for(var j = 0; j < recipients.length; j++) {
		recipString += recipients[j].nickname;
		if(j!=recipients.length-1) {
			recipString += ", ";
		}
	}
	$('#group2group1group1group1').text(recipString);
	//TODO resize if there is overflow
}

function removeRecipient(email) {
	var indexToRemove = -1;
	for(var i in recipients) {
		if(recipients[i].email === email) {
			indexToRemove = i;
		}
	}
	if(indexToRemove != -1) {
		recipients.splice(indexToRemove, 1);
	} 
}

//TODO cycling through recipients
function cycleRecipients(dir) {
    if(dir === 0) {
        // see prev 4
    }
    else if(dir === 1) {
        // see next 4
    }
}


/**** KEYBOARD ****/

function expandKeyboard(textAreaID){
    console.log('EXPANDING KEYBOARD FOR '+textAreaID);

    if(textAreaID === "write") {
        $('.writeSubjectDiv').addClass('hide');
    }
    if(textAreaID === "subjectText" || textAreaID === "toTextArea") {
        $('.writeMessageDiv').addClass('hide');
    }

    if ($('#keyboardFrame').hasClass("hide") ){
        cyclingOn(0); // TURN OFF CYCLING
        $('#keyboardFrame').removeClass("hide");
        $('#keyboardFrame').attr('name', textAreaID); // tell keyboard where to type
        $('#keyboardFrame').attr('src', '/keyboard');
        document.getElementById("keyboardFrame").contentWindow.focus();
    }
}
function hideKeyboard() {

    if (!$('#keyboardFrame').hasClass("hide")){
        $('.writeMessageDiv').removeClass('hide');
        $('.writeSubjectDiv').removeClass('hide');
        
        $('#keyboardFrame').addClass("hide");
        $('#keyboardFrame').removeAttr('name'); 
        $('#keyboardFrame').removeAttr('src');
        $('#keyboardFrame').click();
        cyclingOn(1); // TURN ON CYCLING
        $(window).focus();
    }
}

