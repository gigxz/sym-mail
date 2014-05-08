var pageNumber,
    totalNumber,
    maxPages;

window.addEventListener('load', function(){
    maxPages = 10; //TODO delete
    $('#loadingScreen').fadeIn(0);
    cyclingOn(0); // stop cycling
    get_box_data_page(1, function(data) {
        if(data && data.length > 0) {
            //totalNumber = data.total;
            //maxPages = totalNumber/6;
            replaceBoxMessages(data, function() {
                // everything loaded, start cycling
                $('#loadingScreen').fadeOut(300);
                cyclingOn(1); 
            });
        }
        else {
            $('#loadingScreen').fadeOut(300);
            console.log("NOTHING TO RETRIEVE");
        }
    });
}, false);


/* GET DATA ON A SPECIFIC PAGE */
function get_box_data_page(pgNum, callback) {
    var box = 'http://localhost:8080/getemails/' + meta('boxname')+'/'+pgNum;
    make_request(box, function() {
        if (this.status == 200) {       
            var content = this.responseText;
            var data = JSON.parse(content);
            pageNumber = pgNum; //successful, so change page num
            callback(data);
        } else {
            alert("Feed Request was invalid.");
            callback(null);
        }               
    });  
}

function setPageIndicator() {
    var string = 'page '+pageNumber+' of '+maxPages;
    $('#pageIndicator').text(string);
}

// dir is 1 for next page, -1 for previous page
function scrollBox(dir) {
    var newPage = pageNumber + dir;

    cyclingOn(0); // stop cycling

    get_box_data_page(newPage, function(data) {
        if(data && data.length > 0) {
            //totalNumber = data.total;
            //maxPages = totalNumber/6;
            
            replaceBoxMessages(data, function() {
                cyclingOn(1); // everything loaded, start cycling
            });
        }
        else {
            console.log("ERROR retrieved no data for pg");
            cyclingOn(1);
        }
    });
}

function readEmail(inboxmsg) {
    window.location.href = 'http://localhost:8080/email/' + meta('boxname') + '/' + $(inboxmsg).attr('uid');
}


/* given a list of 6 new messages, replace what's visible in the inbox */
function replaceBoxMessages(newMessages, callback) {
	//alert("Replace Inbox Messages");

    $('.inboxmsg').each(function(index, obj) {
        $(this).attr('uid', newMessages[index].uid);
        
        // replace sender
        var from = newMessages[index].sender.address;
        var name = newMessages[index].sender.name;
        if(name.length>0)
            from = name;
        $(this).find('.sender').text(from);

        // replace subject
        $(this).find('.subject').empty();
        $(this).find('.subject').text(newMessages[index].subject);

        // replace timestamp
        var timestamp = newMessages[index].timestamp;
        $(this).find('.timestamp').text(getFormattedDate(timestamp));

        // replace message
        var htmlMSG = newMessages[index].message;
        $(this).find('.message').empty();
        $(this).find('.message').text($.trim(htmlMSG));
        callback();
    }).promise().done(function() {
        // reset page indicator and arrows
        setPageIndicator();
        showHideNavigationArrows();
        callback();
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
    if(!timestamp)
        return '';
    if(timestamp.length<16)
        return timestamp;
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

