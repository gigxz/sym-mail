var interval;
var request1 = new XMLHttpRequest(); 

var messages = new Array(); 
var count = 0; 


function x(e){
	if (request1.status == 200){
		//do something with the content
		var content = request1.responseText; 
		var data = JSON.parse(content)['messages'];
		var ul = document.getElementById('inbox'); 
		var newItems = 0; 
		for (var item in data) {
			var li = document.createElement('li');
			var post = "<p>" + item["from"] + " " + item["to"] + " "; 
			post += item["date"] + " <br>" + item["subject"]; 
			li.innerHTML = post; 
			var x = ul.getElementsByTagName('li')[0];
    		ul.insertBefore(li, x);
		}
	} else {
		console.log(request1.status);
		//something with wrong
		//403 is forbidden
		//500 internal server error
		//etc? 
	}
	count += newItems; 
}; 

    
	function request(theURL, callback) {
		
		//specifying HTTP method, URL, and asynchronous flag
		request1.open('GET', theURL, true); 
    	
    	//adding an event handler to the request
		request1.addEventListener('load', callback, false); 

		//to start the request, optionally witha request body for POST requsts
		request1.send(null); 
	}; 

// This code will be executed when the page finishes loading
window.addEventListener('load', function(){
	//creating the request
    //sets the interval so that page reloads ever 3000ms
    interval = window.setInterval(function() {request('http://localhost:8080/getMessages', x)}, 5000);
    intervalFunction = setInterval(cycle, waitTime);
    typing(); 

}, false);

// Add more supporting code here!
var groupNumber = 0,
    id = 'group',
    stringGroup,
    intervalFunction,    
    waitTime = 1000;


var typing = function() {
        // prevent default behavior
        // (i.e. page scrolling down when you press space)
        $(document).keydown(function(e) {
            if(e.keyCode === 32) {
                return false;
            }
        });

        $(document).keyup(function(e) {
            if (e.keyCode === 32){
                clearInterval(intervalFunction);
                if (stringGroup === '#goBack') {
                    // if(id === 'group') { // if on top level, go back in browser history
                    //     window.history.back();
                    // }
                    groupNumber = 1; 
                    id = id.slice(0, -6);

                } else {
                    if (document.getElementById(id + groupNumber + 'group1')) {
                        id = id + groupNumber + 'group'
                    } 
                    else {
                        // CLICK ON ITEM
                        console.log(id+groupNumber);
                        document.getElementById(id+groupNumber).click();
                    }    
                }

                intervalFunction = setInterval(cycle, waitTime);

           }
        })
};

var animate = function(stringGroup){
	
    // $( stringGroup ).animate(
    //     {fontSize: '120%', 
    //      //backgroundColor: 'blue'
    //     });
    // setTimeout(function(){
    //     $(stringGroup).animate({fontSize: '100%'})
    // }, waitTime/2); y

	// OPTION 2: border

	$(stringGroup).addClass('boxed');
    setTimeout(function(){
        $(stringGroup).removeClass('boxed');
    }, waitTime);
	
	
	// OPTION 3: changing background color
	// $parent.effect('highlight', {color:'#7D7D7D', easing:'easeInExpo'}, waitTime);
	 //TODO get rgb color and change it
	
};

var elementExists = function() {

    item = document.getElementById(id + groupNumber);
    if (item) {
        return true;
    }
    else {
        groupNumber = 0;
        return false;
    }
}

var cycle = function () {
    groupNumber = groupNumber + 1; 
    if (elementExists()) {
        stringGroup = String('#'+ id + groupNumber);
    } else {
        stringGroup = '#goBack'; 
    }
    animate(stringGroup);

}

var printLetter = function(groupName){
    var $write = $('#write'),
        shift = false,
        capslock = false;
     
        var $this = $(groupName),
            character = $this.html(); // If it's a lowercase letter, nothing happens to this variable
         
        // Shift keys
        if ($this.hasClass('left-shift') || $this.hasClass('right-shift')) {
            $('.letter').toggleClass('uppercase');
            $('.symbol span').toggle();
             
            shift = (shift === true) ? false : true;
            capslock = false;
            return false;
        }
         
        // Caps lock
        if ($this.hasClass('capslock')) {
            $('.letter').toggleClass('uppercase');
            capslock = true;
            return false;
        }
         
        // Delete
        if ($this.hasClass('delete')) {
            var html = $write.html();
             
            $write.html(html.substr(0, html.length - 1));
            return false;
        }
         
        // Special characters
        if ($this.hasClass('symbol')) character = $('span:visible', $this).html();
        if ($this.hasClass('space')) character = ' ';
        if ($this.hasClass('tab')) character = "\t";
        if ($this.hasClass('return')) character = "\n";
         
        // Uppercase letter
        if ($this.hasClass('uppercase')) character = character.toUpperCase();
         
        // Remove shift once a key is clicked.
        if (shift === true) {
            $('.symbol span').toggle();
            if (capslock === false) $('.letter').toggleClass('uppercase');
             
            shift = false;
        }
         
        // Add the character
        $write.html($write.html() + character);
};


var running = $(function(){
    var $write = $('#write'),
        shift = false,
        capslock = false;
     
    $('#keyboard li').click(function(){
        var $this = $(this),
            character = $this.html(); // If it's a lowercase letter, nothing happens to this variable
         
        // Shift keys
        if ($this.hasClass('left-shift') || $this.hasClass('right-shift')) {
            $('.letter').toggleClass('uppercase');
            $('.symbol span').toggle();
             
            shift = (shift === true) ? false : true;
            capslock = false;
            return false;
        }
         
        // Caps lock
        if ($this.hasClass('capslock')) {
            $('.letter').toggleClass('uppercase');
            capslock = true;
            return false;
        }
         
        // Delete
        if ($this.hasClass('delete')) {
            var html = $write.html();
             
            $write.html(html.substr(0, html.length - 1));
            return false;
        }
         
        // Special characters
        if ($this.hasClass('symbol')) character = $('span:visible', $this).html();
        if ($this.hasClass('space')) character = ' ';
        if ($this.hasClass('tab')) character = "\t";
        if ($this.hasClass('return')) character = "\n";
         
        // Uppercase letter
        if ($this.hasClass('uppercase')) character = character.toUpperCase();
         
        // Remove shift once a key is clicked.
        if (shift === true) {
            $('.symbol span').toggle();
            if (capslock === false) $('.letter').toggleClass('uppercase');
             
            shift = false;
        }
         
        // Add the character
        $write.html($write.html() + character);
    });
});




function readEmail(inboxmsg) {
    var from = $(inboxmsg).find($('.sender'))[0].innerHTML;
    var subj = $(inboxmsg).find($('.subject'))[0].innerHTML;
    var body = $(inboxmsg).find($('.message'))[0].innerHTML;
    var path = 'read_email.html';
    window.location.href = path+"?from="+from+"&subj="+subj+"&body="+body;
}
