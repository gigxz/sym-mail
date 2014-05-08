
/* on load */
$(window).load(function() {
    // IF WRITING REPLY (or draft?? TODO)
//	if(meta('uid').length > 0) {

    // IF WRITING REPLY
	if(meta('boxname').length > 0) {
         // loading screen
        $('#loadingScreen').fadeIn(0);

		get_reply_data(function(subjText) {
			if(subjText && subjText.length > 30) {
				subjText = subjText.substring(0, 30 + "...");
			}
			var header = "Inbox > ";
	        if(document.referrer.indexOf("drafts") > -1) {
	            header = "Drafts > ";
	        }
	        if(subjText) {
	            header += subjText;
	        }
	        else {
	            header += "Read Message";
	        }
	        header += " > Reply";
	        $('#pathHeader').text(header);

            $('#loadingScreen').fadeOut(300);
	        showHideScrollArrows();
            // turn on cycling once everything has loaded
            cyclingOn(1);
		});
	}
    // ELSE IF REGULAR COMPOSE
	else {
        cyclingOn(1);
		$('#pathHeader').text('Compose');
	}

    /* event handlers */
    $("#toTextArea").on('change keyup paste', function() {
        var e = document.getElementById('toTextArea');
        if(e.scrollHeight > e.clientHeight) {
            $(this).height(e.scrollHeight+'px');
        }
        setTimeout(saveDraft(this), 3000); 
    });

    $("#subjectText").on('change keyup paste', function() {
        var e = document.getElementById('subjectText');
        if(e.scrollHeight > e.clientHeight) {
            $(this).height(e.scrollHeight+'px');
        }
        setTimeout(saveDraft(this),3000); 
    });


    $("#write").on('change keyup paste', function() {
        showHideScrollArrows();
        setTimeout(saveDraft(this), 3000); 
    });

    $(window).bind('resize', function() {
        showHideScrollArrows();
    });

});





function get_reply_data(callback) {   
    make_request('/getemail/' + meta('boxname')+'/'+meta('uid'), function(e) {
        if (this.status == 200) {    
			var content = this.responseText;
			var data = JSON.parse(content);

			$("#from").html();

			$("#toTextArea").val(data[0].from.address);

			$("#subjectText").val("Re: " + data[0].subject);

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



function submitEmail() {
	var mainform = document.getElementById('mainform');
	mainform.submit();
}

function deleteMessage(inboxmsg) {

    make_request('http://localhost:8080/delete/' + meta("uid"), function(e) {

    }); 
    window.location.href = 'http://localhost:8080/';
}

function saveDraft(msg){
	var request = new XMLHttpRequest();

    url = 'http://localhost:8080/save';
    request.open('POST', url, true);
   	request.setRequestHeader('Content-Type', "application/json"); 
    var emailString = document.getElementById("toTextArea").value;
    emailString = emailString.replace(/\s+/g, '');


    request.send(JSON.stringify({
    	"toText": emailString,
    	"subjectText": document.getElementById("subjectText").value,
    	"bodyText": document.getElementById("write").value, 
        "draft_id": meta("draft_id")
    }));
    //window.location.href = "http://localhost:8080/inbox";
}


function sendMail(msg){
    var request = new XMLHttpRequest();
    url = '/sendmail';
    request.open('POST', url, true);
   	request.setRequestHeader('Content-Type', "application/json"); 



   	var emailString = '';    
    emailString = document.getElementById("toTextArea").value;
    emailString = emailString.replace(/\s+/g, '');

    //verify email addresses
    var listToVerify = emailString.split(',');
    for(item in listToVerify) {
        if(!(validateEmail(listToVerify[item]))) {
            console.log("INVALID EMAIL: "+listToVerify[item]);
            return;
        }
    }
    //TODO CHECK, DONT SEND IF STRING IS EMPTY
    console.log("SENDING TO "+emailString);
    request.send(JSON.stringify({
    	"toText": emailString,
    	"subjectText": document.getElementById("subjectText").value,
    	"bodyText": document.getElementById("write").value
    }));
    //window.location.href = "http://localhost:8080/inbox";
}


var pageNumber;
function expandToSelection(num){
	pageNumber = num; //this is what page you are on


    $('#recipientBoxRow').removeClass('hide');
    // remove hide from all descendants
    $('#recipientBoxRow').find('.hide').removeClass('hide');

	var offset = 0 + parseInt(pageNumber);
	url = '/addressBook/' + offset; 
    make_request(url, function(e) {
    	var content = this.responseText; 
		var abook = JSON.parse(content); 
		abook = abook['contacts'];
		var count = 0; 
		var recipient = $( ".recipient" );
		if (abook.length<recipient.length){
			$(".recipient-container:last").addClass('hide');
			$(".email-address:last").addClass('hide');
			$('.seeNextRecip').addClass('hide');
		}
		for (var i = 0; i < recipient.length && i < abook.length; i++) {
			if (abook[i]['nickname'] != ""){
				recipient[i].innerHTML = abook[i]['nickname']; 
			} else {
				recipient[i].innerHTML = abook[i]['email']; 
			}

            // if in recipients list, make active
            var emailString = '';    
            emailString = document.getElementById("toTextArea").value;
            emailString = emailString.replace(/\s+/g, '');
            var emailList = emailString.split(',');


            for(var k in emailList) {
                if(emailList[k].toLowerCase() === abook[i]['email'].toLowerCase()) {
                    $(recipient[i]).addClass('active');
                }
                else {
                    $(recipient[i]).removeClass('active');
                }
            }

		};

		var emails = $( ".email-address" ); 
		for (var i = 0; i < emails.length && i < abook.length; i++) {
 			emails[i].innerHTML = abook[i]['email']; 
		};
    }); 

    

    if (pageNumber==0){
    	$('.seePrevRecip').addClass('hide'); //no prevs to start with
    }
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

// toggle recipient in selection
function toggleRecipient(obj) {
	var name = $(obj).text().trim();
	var addr = $(obj).parent().find('.email-address').text();

	// if no email address, name is email address
	if(addr === "") {
		addr = name;
	}
    var added = true;

	if($(obj).find('.recipient').hasClass('active')) {
		$(obj).find('.recipient').removeClass('active');
        added=false;
	}
	else {
		$(obj).find('.recipient').addClass('active');
	}

	// make recipients list into comma-separated string
    var emailString = '';    
    emailString = document.getElementById("toTextArea").value;

    if(added) {
        // add email to the string
        var start = (emailString==='') ? '' : ', ';
        emailString+=start+addr;
    }
    else {
        // remove email from the string
        emailString = emailString.replace(/\s+/g, '');
        var emailList = emailString.split(',');
        var newEmailString = '';
        for(var k in emailList) {
            if(!(emailList[k].toLowerCase() === addr.toLowerCase())) {
                newEmailString+=emailList[k]+', ';
            }
        }
        emailString = newEmailString.substring(0, newEmailString.length-2);

    }

	$('#toTextArea').val(emailString);
    $('#toTextArea').change();
}

function cycleRecipients(dir) {
    if(dir === 0) {
        expandToSelection(pageNumber-1);
    }
    else if(dir === 1) {
		$('.seePrevRecip').removeClass('hide');
        expandToSelection(pageNumber+1);
    }
}


/**** KEYBOARD ****/

function expandKeyboard(textAreaID){
    if(textAreaID === "write") {
        $('.writeSubjectDiv').addClass('hide');
		$('.writeRecipientDiv').addClass('hide');
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
		$('.writeRecipientDiv').removeClass('hide');
        
        $('#keyboardFrame').addClass("hide");
        $('#keyboardFrame').removeAttr('name'); 
        $('#keyboardFrame').removeAttr('src');
        $('#keyboardFrame').click();
        cyclingOn(1); // TURN ON CYCLING
        $(window).focus();
    }
}

$.fn.selectRange = function(start, end) {
    if(!end) end = start; 
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};
