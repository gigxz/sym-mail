var pageNumber,
    totalNumber,
    maxPages;

window.addEventListener('load', function(){
    pageNumber = 1;
    maxPages = 5; //TODO

    get_box_data(function(data) {
        //totalNumber = data.total;
        //maxPages = totalNumber/6;
        replaceBoxMessages(data);
        setPageIndicator();
        //showHideNavigationArrows();
    });
}, false);

function get_box_data(callback) {   
    var box = 'http://localhost:8080/getemails/' + meta('boxname');
    make_request(box, function(e) {
        if (this.status == 200) {       
            var content = this.responseText;
            var data = JSON.parse(content);
            callback(data);
        } else {
            alert("Feed Request was invalid.");
        }               
    });
}

/* GET DATA ON A SPECIFIC PAGE */
function get_box_data_page(pgNum, callback) {
    var box = 'http://localhost:8080/getemails/' + meta('boxname')+'/'+pgNum;
    console.log("REQUESTING PAGE "+pgNum);
    make_request(box, function(e) {
        if (this.status == 200) {       
            var content = this.responseText;
            var data = JSON.parse(content);
            callback(data);
        } else {
            alert("Feed Request was invalid.");
        }               
    });  
}

function setPageIndicator() {
    var string = 'page '+pageNumber+' of '+maxPages;
    $('#pageIndicator').text(string);
}

function scrollBox(dir) {
    // page up
    if(dir===1) {
        pageNumber--;
        get_box_data_page(pageNumber, function(data) {
            //totalNumber = data.total;
            //maxPages = totalNumber/6;
            replaceBoxMessages(data);
            setPageIndicator();
            //showHideNavigationArrows();
        });
    }

    // page down
    else if(dir === -1) {
        pageNumber++;
        get_box_data_page(pageNumber, function(data) {
            //totalNumber = data.total;
            //maxPages = totalNumber/6;
            console.log("CALLING PAGE DOWN");
            replaceBoxMessages(data);
            setPageIndicator();
            //showHideNavigationArrows();
        });
    }
}

function readEmail(inboxmsg) {
    window.location.href = 'http://localhost:8080/email/' + meta('boxname') + '/' + $(inboxmsg).attr('uid');
}


/* given a list of 6 new messages, replace what's visible in the inbox */
function replaceBoxMessages(newMessages) {
	//alert("Replace Inbox Messages");
    $('.inboxmsg').each(function(index, obj) {
        $(this).attr('uid', newMessages[index].uid);

        // replace sender
        $(this).find('.sender').text(newMessages[index].sender);

        // replace subject
        $(this).find('.subject').text(newMessages[index].subject);

        // replace timestamp
        var timestamp = newMessages[index].timestamp
        $(this).find('.timestamp').text(getFormattedDate(timestamp));

        // replace message
        $(this).find('.message').text(newMessages[index].message);
    });
}



function showHideNavigationArrows() {
    if(pageNumber === 1) {
        // hide up arrow
        $('.arrowup').addClass('hide');
    }
    else {
        // show up arrow
        $('.arrowup').removeClass('hide');
        $('.arrows').removeClass('hide');
    }
    if(pageNumber === maxPages) {
        // hide down arrow
        $('.arrowdown').addClass('hide');
    }
    else {
        $('.arrowdown').removeClass('hide');
        $('.arrows').removeClass('hide');
    }

    // hide wrapper
    if($('.arrowup').hasClass('hide') && $('.arrowdown').hasClass('hide')) {
        $('.arrows').addClass('hide');
    }
}




var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
    'Oct', 'Nov', 'Dec'];
function getFormattedDate(timestamp) {
    var month = parseInt(timestamp.substring(5,7));
    var day = parseInt(timestamp.substring(8,10));
    var year = parseInt(timestamp.substring(0, 4));
    var hr = parseInt(timestamp.substring(11,13));
    var min = parseInt(timestamp.substring(14,16));
    var displayString = months[month-1]+" "+day;

    // construct email's date object (time received)
    var email = new Date();
    email.setDate(day);
    email.setMonth(month-1);
    email.setFullYear(year);
    email.setHours(hr);
    email.setMinutes(min);
    // dates are given in GMT so subtract offset
    var offset = new Date().getTimezoneOffset();
    offset = offset/60;
    email.addHours(-offset); 

    // if same date, displace time isntead
    var today = new Date();
    if(today.getDate() === email.getDate() && 
        today.getMonth() === email.getMonth() &&
        today.getFullYear() === email.getFullYear()) {
        
        hr = email.getHours();
        min = email.getMinutes();
        var ext = 'am';
        if(hr > 12) {
            hr = hr % 12;
            ext = 'pm';
        }
        else if (hr === 0){
            hr = 12;
            ext = 'am';
        }
        if(min<10) {
            min = "0"+min;
        }
        displayString = hr+":"+min+ext;
    }

    return displayString;
}

Date.prototype.addHours = function(h) {    
   this.setTime(this.getTime() + (h*60*60*1000)); 
   return this;   
}

