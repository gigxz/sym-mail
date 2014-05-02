var groupNumber = 0,
    id = 'group',
    stringGroup,
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
    // for everything starting with 'group'
    $("[id^='group']").each(function(index, obj) {
        /* add borsder fades in and out  for groups */
        $(this).css({transition: 'border 0.5s ease'});
    });
}
function showTimeValue(newValue) {
	document.getElementById("time").innerHTML=newValue;
	setCycleTime(newValue);
}

function showFontValue(newValue) {
	document.getElementById("size").innerHTML=newValue;
	// update actual font
	setFontSize(newValue);
}

function setFontSize(val) {
    console.log("setting font size var to "+val);
    fontSize = val;
	document.body.style.setProperty('font-size', fontSize+'px', 'important' );
}

function setCycleTime(val) {
	console.log("setting cycle time var to "+val*1000);
	waitTime = val*1000;
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
                if (stringGroup === '#goBack') {
                    // ex. compose checks special things if goback is clicked
                    document.getElementById('goBack').click();

                    groupNumber = 0; 
                    id = id.slice(0, -6);
                    if (id.length < 2) {
                        window.history.back();
                    }
                    if ( $( "#keyboard").is(":visible") ){
                        $( '#keyboard').slideUp();
                    }


                } else {

                    if ( document.getElementById(id+groupNumber).className === 'requiresKeyboard boxed'){
                            expandKeyboard();
                            id = id + groupNumber + 'group'
                            groupNumber = 0;
                    }
                    else {

                        // if one level down exists AND is not hidden
                        var levelDownSelecter = '#'+id + groupNumber + 'group1';
                        if ($(levelDownSelecter).length && !$(levelDownSelecter).hasClass('hide')) {
                            id = id + groupNumber + 'group'
                            groupNumber = 0;
                        } 
                        else {
                            // CLICK ON ITEM
                            console.log("Clicking on: "+id+groupNumber);
                            document.getElementById(id+groupNumber).click();
                        }    
                    }
                }

                intervalFunction = setInterval(cycle, waitTime);

                console.log("nxt: "+id+groupNumber);
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


	$(stringGroup).addClass('boxed');
    setTimeout(function(){
        $(stringGroup).removeClass('boxed');
    }, waitTime);
	
	
	// OPTION 3: changing background color
	//$(stringGroup).effect('highlight', {color:'#7D7D7D', easing:'easeInExpo'}, waitTime);
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

// version that doesn't change groupnumber or use global variables
var elementExists2 = function(idToCheck) {
    item = document.getElementById(idToCheck);
    if (item) {
        return true;
    }
    else {
        return false;
    }
}

// number of direct children (group1 -->  group1group1, group1group2)
// var getGroupChilds = function(idToCheck) {
//     var count = 0;
//     var len = idToCheck.length + 6;
//     var groupChilds = [];
//     // for everything starting with 'idToCheck'
//     $("[id^='"+idToCheck+"']").each(function(index, obj) {
        
//         if($(this).attr('id').length === len && !$(this).hasClass('hide')) {
//             //console.log($(this).attr('id') +" is child of "+idToCheck);
//             groupChilds.push($(this));
//         }
//     });
//     return groupChilds;
// }

var cycle = function () {
    // the do-while loop skips over elements with class 'hide'
    var curr;

    do {
        groupNumber = groupNumber + 1; 
        curr = id + groupNumber; // temp element to check

        if(elementExists2(curr)) {
            stringGroup = String('#'+ curr);
        }
        else {
            stringGroup = '#goBack';
            groupNumber = 0; 
            break;
        }
    } while($('#'+curr).hasClass('hide') || $('#'+curr).hasClass('skip'));

    animate(stringGroup);

}

// var printLetter = function(groupName){
//     var $write = $('#write'),
//         shift = false,
//         capslock = false;
     
//         var $this = $(groupName),
//             character = $this.html(); // If it's a lowercase letter, nothing happens to this variable
         
//         // Shift keys
//         if ($this.hasClass('left-shift') || $this.hasClass('right-shift')) {
//             $('.letter').toggleClass('uppercase');
//             $('.symbol span').toggle();
             
//             shift = (shift === true) ? false : true;
//             capslock = false;
//             return false;
//         }
         
//         // Caps lock
//         if ($this.hasClass('capslock')) {
//             $('.letter').toggleClass('uppercase');
//             capslock = true;
//             return false;
//         }
         
//         // Delete
//         if ($this.hasClass('delete')) {
//             var html = $write.html();
             
//             $write.html(html.substr(0, html.length - 1));
//             return false;
//         }
         
//         // Special characters
//         if ($this.hasClass('symbol')) character = $('span:visible', $this).html();
//         if ($this.hasClass('space')) character = ' ';
//         if ($this.hasClass('tab')) character = "\t";
//         if ($this.hasClass('return')) character = "\n";
         
//         // Uppercase letter
//         if ($this.hasClass('uppercase')) character = character.toUpperCase();
         
//         // Remove shift once a key is clicked.
//         if (shift === true) {
//             $('.symbol span').toggle();
//             if (capslock === false) $('.letter').toggleClass('uppercase');
             
//             shift = false;
//         }
         
//         // Add the character
//         $write.html($write.html() + character);
// };


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


function expandKeyboard(){
    if ($("#keyboard").is(":hidden") ){
        $('#keyboard' ).show("slow"); 
    }
    else {
        $('#keyboard').slideUp();
    }
}

function expandToSelection(){
    $('#recipientBoxRow').removeClass('hide');
    // remove hide from all descendants
    $('#recipientBoxRow').find('.hide').removeClass('hide');

    //TODO comment back in
    $('.seePrevRecip').addClass('hide'); //no prevs to start with
    // set id to id of seePrevRecip
    var newID = $('.seePrevRecip').attr('id');
    newID = newID.substring(0, newID.length-1);
    id = newID;
    groupNumber = 0;
}

function followLink(pageName) {
    var url = 'http://localhost:8080/'+pageName;
    window.location.href = url;//+'?size='+fontSize;
}

function getQueryVariable(query, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(query);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


// scroll the text of a given class 
// dir is -1 or 1
function scrollText(dir) { 
    var fontSize = $(document.body).css("font-size").substring(0,2);
    var dist = fontSize * 70;
    var i = setInterval(function() {
        $('.scrollableText').scrollTop($('.scrollableText').scrollTop() + dir);
    },10);

    setTimeout(function() {
        clearInterval(i);
    }, dist);

}

function showHideScrollArrows() {
    var e = document.getElementsByClassName('scrollableText')[0];
    // if text is 'overflowed', show scroll arrows
    if(e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth) {
        $('.arrows').removeClass('hide');
    }
    // if not, hide them
    else {
        $('.arrows').addClass('hide');
    }
}

function make_request(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    console.log("Making a http request to: " + url);
    request.addEventListener('load', callback, false);  
    request.send(null);
    //return request;
}

function meta(name) {
    	var tag = document.querySelector('meta[name=' + name + ']');
    	if (tag != null)
        	return tag.content;
    	return '';
}