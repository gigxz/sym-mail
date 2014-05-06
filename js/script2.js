var groupNumber = 0,
    id = 'group',
    stringGroup,
    intervalFunction,    
    waitTime = 1000,
    fontSize,
    cyclingActive = false;

/* sets up for cycling but does not start it */
window.addEventListener('load', function(){
    $(window).focus();
    //set font size
    fontSize = getQueryVariable(window.location.search, 'size');
    if(fontSize==='')
        fontSize='20'; //default
    document.body.style.setProperty('font-size', fontSize+'px', 'important' );

    addTransitions();
}); 

/* cyclingOn(1) to BEGIN, cyclingOn(0) to STOP */
function cyclingOn(num) {
    // turn on
    if(num===1 && cyclingActive===false) {
        cyclingActive = true;
        console.log("CYCLING: ON");
        $(window).focus();
        clearInterval(intervalFunction);
        groupNumber = 0;
        id = 'group';
        waitTime = 1000;
        intervalFunction = setInterval(cycle, waitTime);
        clickHandler(); 
    }
    // turn off
    else if(num===0 && cyclingActive===true) {
        cyclingActive = false;
        console.log("CYCLING: OFF");
        window.clearInterval(intervalFunction);
    }
}


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
    //console.log("setting font size var to "+val);
    fontSize = val;
	document.body.style.setProperty('font-size', fontSize+'px', 'important' );
}

function setCycleTime(val) {
	//console.log("setting cycle time var to "+val*1000);
	waitTime = val*1000;
}

var clickHandler = function() {
        // prevent default behavior
        // (i.e. page scrolling down when you press space)
        $(document).keydown(function(e) {
            if(e.keyCode === 32) {
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        });

        $(document).keyup(function(e) {
            if (e.keyCode === 32){
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault(); 
                if(!cyclingActive) {
                    return;
                }

                clearInterval(intervalFunction);
                if (stringGroup === '#goBack') {
                    // ex. compose checks special things if goback is clicked
                    document.getElementById('goBack').click();

                    groupNumber = 0; 
                    id = id.slice(0, -6);
                    if (id.length < 2) {
                        window.history.back();
                    }
                    intervalFunction = setInterval(cycle, waitTime);
                }
                else {
                    if ($('#'+id+groupNumber).hasClass('requiresKeyboard')){
                        expandKeyboard($('#'+id+groupNumber).find('textarea').attr('id'));
                    }
                    else {
                        // if one level down exists AND is not hidden
                        var levelDownSelecter = '#'+id + groupNumber + 'group1';
                        hasUnhiddenChildren(id+groupNumber, function(numChildren, singleChildID) {
                            if ($(levelDownSelecter).length && numChildren > 1){//!$(levelDownSelecter).hasClass('hide')) {
                                id = id + groupNumber + 'group'
                                groupNumber = 0;
                            } 
                            else if(numChildren === 1) {
                                id = singleChildID.substring(0, singleChildID.length-1);
                                groupNumber = singleChildID.substring(singleChildID.length-1, singleChildID.length);
                                document.getElementById(singleChildID).click();
                            }
                            else {
                                //CLICK ON ITEM
                                //TODO FIX THIS BUG WTF
                                if(elementExists(id+groupNumber)) {
                                    document.getElementById(id+groupNumber).click();
                                }
                                else {
                                    console.log("WHAAaaaaaaAAAt");
                                }
                            } 
                        
                            intervalFunction = setInterval(cycle, waitTime); 
                        });
    
                    }
                }
                 
                //console.log("CLICK IN SCRIPT2: "+id+groupNumber);
           }
        });
};

var hasUnhiddenChildren = function(groupid, callback) {
    var child_id_len = groupid.length + "group".length + 1;
    var numVisibleChildren = 0;
    var onlyChildID = null;

    $("[id^='"+groupid+"']").each(function(index, obj) {
        if($(this).attr('id').length === child_id_len) {
            if(!$(this).hasClass('hide')){
                numVisibleChildren++;
                if(onlyChildID === null)
                    onlyChildID = $(this).attr('id');
            }
        }
    }).promise().done(function() {
        callback(numVisibleChildren, onlyChildID);
    });
}


var animate = function(stringGroup){
	if(!cyclingActive)
        return;
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


// version that doesn't change groupnumber or use global variables
var elementExists = function(idToCheck) {
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
        groupNumber = groupNumber + 1; 
        curr = id + groupNumber; // temp element to check
        if(elementExists(curr)) {
            stringGroup = '#'+ curr;
        }
        else {
            stringGroup = '#goBack';
            groupNumber = 0; 
            break;
        }
    } while($('#'+curr).hasClass('hide'));
    animate(stringGroup);
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