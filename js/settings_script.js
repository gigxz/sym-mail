
function addContact() {
	var name = $('#nameBox').val();
	var address = $('#addressBox').val();

	if(!(validateEmail(address))) {
		$('#contact-notifiction').text(address+" is not a valid email address.");
		$( "#contact-notifiction" ).fadeIn(400).delay(4000).fadeOut(400);
	}
	else {

		var from = "speakyourmail@gmail.com"; //TODO
		var url = '/setAddress/'+from+'/'+address+'/'+name;
		make_request(url, function() {
			if (this.status == 200) {   
				//success    
				$('#contact-notifiction').html("Contact added successfully: <br />"+name+"  &lt;"+address+"&gt;");
			}
			else {
				//error
				$('#contact-notifiction').html("Failed to add contact.");
			}
			$("#contact-notifiction" ).fadeIn(400).delay(4000).fadeOut(400);
		});
	}
}
