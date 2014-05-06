var keyNumber = 0,
    id = 'key',
    stringkey,
    intervalFunction,    
    waitTime = 1000,
    fontSize,
    isActive = false,
    caretPosition;

window.addEventListener('load', function(){
    //TODO set font size ( get it from meta tag )
    fontSize='18'; //default
    addKeyStyles();
    restartKeyboard();
}); 

function restartKeyboard() {
    caretPosition = 0;
    isActive = true;
    keyNumber = 0;
    id = 'key';
    intervalFunction = setInterval(cycle, waitTime);
    keyboardCycling();     
}

function stopKeyboard() {
    isActive = false;
    clearInterval(intervalFunction);
}

function addKeyStyles() {
    // for everything starting with 'key'
    $("[id^='key']").each(function(index, obj) {
        /* add borsder fades in and out  for keys */
        $(this).css({transition: 'border 0.5s ease'});
    });
    document.body.style.setProperty('font-size', fontSize+'px', 'important' );
}

function keyboardCycling() {
        // prevent default behavior
        // (i.e. page scrolling down when you press space)
        $(document).keydown(function(e) {
            if(e.keyCode === 32) {
                return false;
            }
        });

        $(document).keyup(function(e) {
            if (e.keyCode === 32 && isActive){
                clearInterval(intervalFunction);
                if (stringkey === '#back-key') {
                    document.getElementById('back-key').click();

                    keyNumber = 0; 
                    id = id.slice(0, -4);
                    if (id.length < 2) {
                        //stop cycling, tell parent document to hide keyboard
                        stopKeyboard();
                        window.parent.document.getElementById('hideKeyboard').click();
                    }
                    else {
                        keyNumber = 0;
                        id = 'key';
                        intervalFunction = setInterval(cycle, waitTime);
                    }
                }
                else {
                    // if one level down exists AND is not hidden
                    var levelDownSelecter = '#'+id + keyNumber + 'key1';
                    if ($(levelDownSelecter).length) {
                        id = id + keyNumber + 'key'
                        keyNumber = 0;
                    } 
                    else {
                        // CLICK ON ITEM
                        typeKey(id+keyNumber);
                    }  
                    intervalFunction = setInterval(cycle, waitTime);  
                }
           }
        });
};






var cycle = function () {
    keyNumber = keyNumber + 1; 
    var curr = id + keyNumber; // temp element to check
    if(keyIDexists(curr)) {
        stringkey = String('#'+ curr);
    }
    else {
        stringkey = '#back-key';
        keyNumber = 0; 
    }
    animateKey(stringkey);
}

var animateKey = function(stringkey){
    $(stringkey).addClass('boxed');
    setTimeout(function(){
        $(stringkey).removeClass('boxed');
    }, waitTime);   
};


// version that doesn't change keynumber or use global variables
var keyIDexists = function(idToCheck) {
    item = document.getElementById(idToCheck);
    if (item) {
        return true;
    }
    else {
        return false;
    }
}

function typeKey(keyID) {
//    console.log(keyID);
    if(keyID.substring(keyID.length-1, keyID.length) === '0') {
        console.log(keyID);
        return;
    }
    var textAreaID = window.parent.document.getElementById('keyboardFrame').getAttribute('name');
    var $txtAr = $(window.parent.document.getElementById(textAreaID));
    $txtAr.selectRange(caretPosition);
    var textAreaTxt = $txtAr.val();

    // give focus back to self
    $(window).focus();

    var shift = false,
        capslock = false;
     
    var $this = $('#'+keyID+' li');
    //console.log($this);
    var character = $this.html(); // If it's a lowercase letter, nothing happens to this variable
    //console.log(character);
    // Shift key
    if ($this.hasClass('left-shift')) {
        $('.letter').toggleClass('uppercase');
        $('.symbol span').toggle();
        shift = (shift === true) ? false : true;
        capslock = false;
        return;
    }
     
    // Caps lock
    if ($this.hasClass('capslock')) {
        $('.letter').toggleClass('uppercase');
        capslock = true;
        return;
    }
     
    // Delete
    if ($this.hasClass('delete')) {
        //var len = textarea.value.length;
        
        if(caretPosition>0) {
            $txtAr.val(textAreaTxt.substring(0, caretPosition-1) + textAreaTxt.substring(caretPosition));
            caretPosition--;
        }
        return;
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
        return;
    }
     
    // Add the character
    $txtAr.val(textAreaTxt.substring(0, caretPosition) + character + textAreaTxt.substring(caretPosition));
    caretPosition++;
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

