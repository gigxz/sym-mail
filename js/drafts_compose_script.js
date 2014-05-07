function get_reply_data(callback) {   
    make_request('http://localhost:8080/getemail/' + meta('boxname')+'/'+meta('uid'), function(e) {
        if (this.status == 200) {    
			var content = this.responseText;
			var data = JSON.parse(content);

			$("#from").html();

			$("#toTextArea").html(data[0].from.address);

			recipients.push(new Recipient(data[0].from.name, data[0].from.address));
			$("#subjectText").html(data[0].subject);
            $("#replyText").html(data[0].body);

            // var plainText = jQuery('<div>').html(data[0].body).text();
            // console.log(data[0]);
            $('#write').val(data[0].text);
            $('#write').selectRange(0);
            callback(data[0].subject);
        }
        else {
            alert("Feed Request was invalid.");
        }               
    });
}

function deleteMessage(inboxmsg) {
    make_request('http://localhost:8080/delete/' + meta("draft_id"), function(e) {
    }); 
    window.location.href = 'http://localhost:8080/';

}
