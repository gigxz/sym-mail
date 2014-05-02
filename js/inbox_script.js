window.addEventListener('load', function(){
    get_box_data();
}, false);

function get_box_data() {   
    var box = 'http://localhost:8080/getemails/' + meta('boxname');
    make_request(box, function(e) {
        if (this.status == 200) {       
            var content = this.responseText;
            var data = JSON.parse(content);
            replaceInboxMessages(data);
        } else {
            alert("Feed Request was invalid.");
        }               
    });
}


function scrollUp() {
    // if at top:  arrow should be hidden
    // else: request prev 6 messages, replace
    var newMessages = dummyGetNewMessages(); 
    replaceInboxMessages(newMessages);
}

function scrollDown() {
    // request next 6 messages from backend
    // probably send ID of last msg in list as parameter
    var newMessages = dummyGetNewMessages(); 
    replaceInboxMessages(newMessages);
}


function readEmail(inboxmsg) {
    window.location.href = 'http://localhost:8080/email/' + $(inboxmsg).attr('uid');
}


/* given a list of 6 new messages, replace what's visible in the inbox */
function replaceInboxMessages(newMessages) {
	//alert("Replace Inbox Messages");
    $('.inboxmsg').each(function(index, obj) {
        $(this).attr('uid', newMessages[index].uid);

        // replace sender
        $(this).find('.sender').text(newMessages[index].sender);

        // replace subject
        $(this).find('.subject').text(newMessages[index].subject);

        // replace timestamp
        var timestamp = newMessages[index].timestamp
        $(this).find('.timestamp').text(timestamp.substring(5,10));

        // replace message
        $(this).find('.message').text(newMessages[index].message);
    });
}

