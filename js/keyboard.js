var keyNumber = 0,
    id = 'key',
    stringkey,
    intervalFunction,    
    waitTime = 1000,
    fontSize;

window.addEventListener('load', function(){
    //set font size
    fontSize = getQueryVariable(window.location.search, 'size');
    if(fontSize==='')
        fontSize='20'; //default
    document.body.style.setProperty('font-size', fontSize+'px', 'important' );

    addTransitions();
    intervalFunction = setInterval(cycle, waitTime);
    typing(); 

}); 
function addTransitions() {
    // for everything starting with 'key'
    $("[id^='key']").each(function(index, obj) {
        /* add borsder fades in and out  for keys */
        $(this).css({transition: 'border 0.5s ease'});
    });
}
function setFontSize(val) {
    console.log("setting font size var to "+val);
    fontSize = val;
	document.body.style.setProperty('font-size', fontSize+'px', 'important' );
}
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
                if (stringkey === '#goBack') {
                    // ex. compose checks special things if goback is clicked
                    document.getElementById('goBack').click();

                    keyNumber = 0; 
                    id = id.slice(0, -6);
                    if (id.length < 2) {
                        window.history.back();
                    }
                    if ( $( "#keyboard").is(":visible") ){
                        $( '#keyboard').slideUp();
                    }


                } else {

                    if ( document.getElementById(id+keyNumber).className === 'requiresKeyboard boxed'){
                            expandKeyboard();
                            id = id + keyNumber + 'key'
                            keyNumber = 0;
                    }
                    else {

                        // if one level down exists AND is not hidden
                        var levelDownSelecter = '#'+id + keyNumber + 'key1';
                        if ($(levelDownSelecter).length && !$(levelDownSelecter).hasClass('hide')) {
                            id = id + keyNumber + 'key'
                            keyNumber = 0;
                        } 
                        else {
                            // CLICK ON ITEM
                            console.log("Clicking on: "+id+keyNumber);
                            document.getElementById(id+keyNumber).click();
                        }    
                    }
                }

                intervalFunction = setInterval(cycle, waitTime);

                console.log("nxt: "+id+keyNumber);
           }
        })
};

var animate = function(stringkey){
	
    // $( stringkey ).animate(
    //     {fontSize: '120%', 
    //      //backgroundColor: 'blue'
    //     });
    // setTimeout(function(){
    //     $(stringkey).animate({fontSize: '100%'})
    // }, waitTime/2); 


	$(stringkey).addClass('boxed');
    setTimeout(function(){
        $(stringkey).removeClass('boxed');
    }, waitTime);
	
	
	// OPTION 3: changing background color
	//$(stringkey).effect('highlight', {color:'#7D7D7D', easing:'easeInExpo'}, waitTime);
	 //TODO get rgb color and change it
	
};

var elementExists = function() {

    item = document.getElementById(id + keyNumber);
    if (item) {
        return true;
    }
    else {
        keyNumber = 0;
        return false;
    }
}

// version that doesn't change keynumber or use global variables
var elementExists2 = function(idToCheck) {
    item = document.getElementById(idToCheck);
    if (item) {
        return true;
    }
    else {
        return false;
    }
}


var cycle = function () {
    // the do-while loop skips over elements with class 'hide'
    var curr;

    do {
        keyNumber = keyNumber + 1; 
        curr = id + keyNumber; // temp element to check

        if(elementExists2(curr)) {
            stringkey = String('#'+ curr);
        }
        else {
            stringkey = '#goBack';
            keyNumber = 0; 
            break;
        }
    } while($('#'+curr).hasClass('hide') || $('#'+curr).hasClass('skip'));

    animate(stringkey);

}

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

function getQueryVariable(query, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(query);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
