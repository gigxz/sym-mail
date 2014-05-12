var autosaveTimer = null;

/* on load */
$(window).load(function() {

     // loading screen
    $('#loadingScreen').fadeIn(0);

	get_message_data(function(data) {
        // brand new draft
        if(data.length < 1) {
            // begin
            $('#pathHeader').text('Compose');
            $('#loadingScreen').fadeOut(300);
            cyclingOn(1);
            return;
        }


        // is from draft box or not
        var box = meta('boxname');
        var fromDraftBox = false;
        if(box.toLowerCase().indexOf('drafts') > -1) {
            fromDraftBox = true;
        }        

        var toString = '';

        var subjectString = (data[0].subject) ? data[0].subject : '';
        var bodyText = '';
        var header = '';

        // from draft box
        if(fromDraftBox) {
            for(t in data[0].to) {
                
                var e = data[0].to[t].address;
                //TODO dont add 'self' to list
                toString += e+', ';
            }
            if(toString.length > 2) {
                toString = toString.substring(0, toString.length-2);
            }        
            bodyText = data[0].text;
            header = 'EDITING A DRAFT';
        }
        // reply (from inbox)
        else {
            // reply-all
            var senderReplyingTo = data[0].from.address;
            toString += senderReplyingTo+", ";
            for(item in data[0].to) {
                var n = data[0].to[item].name;
                var e = data[0].to[item].address;
                //TODO dont add 'self' to list
                if(!(e==='speakyourmail@gmail.com') && !(e===senderReplyingTo)) {
                    toString += n + " "+e;
                    toString += ", ";
                }
            }
            toString = toString.substring(0, toString.length-2);
            subjectString = (subjectString.length>0) ? 'Re: ' + subjectString : '';
            bodyText = jQuery('<div>').html(data[0].body).text();
            bodyText = '\n\n\n-----\n'+bodyText;

            // FILL HEADER 
            var subjText = data[0].subject;

            if(subjText && subjText.length > 30) {
                subjText = subjText.substring(0, 30) + "...";
            }
            else if (subjText === '') {
                // handle ('no subject')
                subjText = '(no subject)';
            }
            header = "Inbox > " +subjText + " > Reply";
        }


        $("#toTextArea").val(toString);
        $("#subjectText").val(subjectString);
        $('#write').val(bodyText);
        $('#write').selectRange(0);

        $('#pathHeader').text(header);

        // begin
        $('#loadingScreen').fadeOut(300);
        autosizeTextarea('toTextArea');
        autosizeTextarea('subjectText');
        showHideScrollArrows();
        cyclingOn(1);
	});


    /* event handlers */
    $("#toTextArea").on('change keyup paste', function() {
        autosizeTextarea('toTextArea');
        if(autosaveTimer === null) {
            autosaveTimer = window.setTimeout(timeoutFunction, 3000);
        }
    });

    $("#subjectText").on('change keyup paste', function() {
        autosizeTextarea('subjectText');
        if(autosaveTimer === null) {
            autosaveTimer = window.setTimeout(timeoutFunction, 3000);
        }
    });


    $("#write").on('change keyup paste', function() {
        showHideScrollArrows();
        if(autosaveTimer === null) {
            autosaveTimer = window.setTimeout(timeoutFunction, 3000);
        } 
    });

    $(window).bind('resize', function() {
        showHideScrollArrows();
    });

});

function timeoutFunction() {
    saveDraft(this);
    autosaveTimer = null;
}
function autosizeTextarea(textAreaID) {
    // timeout to wait for letter to print
    setTimeout(function() {
        var e = document.getElementById(textAreaID);
        if(e.scrollHeight > e.clientHeight) {
            var newHeight = e.scrollHeight + 10;
            e.style.cssText = 'height:0; padding:0';
            e.style.cssText = 'height:' + newHeight + 'px';
        }
    }, 0);
}


function get_message_data(callback) {   
    make_request('/getemail/' + meta('boxname')+'/'+meta('uid'), function(e) {
        console.log('MADE REQUEST. '+this.status);
        if (this.status == 200) {    
			var content = this.responseText;
			var data = JSON.parse(content);
            callback(data);
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
    make_request('/delete/' + meta("uid"), function(e) {

    }); 
    window.location.href = '/';
}

function saveDraft(msg){
	var request = new XMLHttpRequest();
    console.log("AUTOSAVING");
    url = '/save';
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
            console.log("INVALID EMAIL:"+listToVerify[item]);
            return;
        }
    }
    request.send(JSON.stringify({
    	"toText": emailString,
    	"subjectText": document.getElementById("subjectText").value,
    	"bodyText": document.getElementById("write").value
    }));
    window.location.href = "/inbox";
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
    autosizeTextarea('toTextArea');
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
