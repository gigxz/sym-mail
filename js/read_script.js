var subject = "";
var sender = "";

window.onload = function() {
    $('#loadingScreen').fadeIn(0);
    get_message_data(function() {
        // set up header
        var header = "Inbox";
        if(document.referrer.indexOf("drafts") > -1) {
            header = "Drafts";
        }
        if($("#subject").text().length > 0) {
            var subj = $("#subject").text();
            if(subj.length > 100) {
                subj = subj.substring(0,30) + "...";
            }
            header += " > " + subj;
        }
        else {
            header += " > Read Message";
        }
        $('#pathHeader').text(header);

        // show/hide arrows and begin cycling
        $('#loadingScreen').fadeOut(300);
        showHideScrollArrows();
        cyclingOn(1);
    });
}

// when window is resized, check again if you need arrows
$(window).bind('resize', function() {
    showHideScrollArrows();
});

function deleteMessage(inboxmsg) {
    make_request('http://localhost:8080/delete/' + meta('boxname') +'/' +meta('uid'), function(e) {
        //console.log("Message" + $(inboxmsg).attr('uid') + " deleted");
        //window.location.href = 'http://localhost:8080/';
        
    }); 
    window.location.href = document.referrer;
}


function get_message_data(callback) {   
    make_request('http://localhost:8080/getemail/' + meta('boxname') + '/' + meta('uid'), function(e) {
        if (this.status == 200) {    
            var content = this.responseText;
            var data = JSON.parse(content);
            $("#from").text(data[0].from.address);

            var toString = '';
            for(item in data[0].to) {
                var n = data[0].to[item].name;
                var e = data[0].to[item].address;
                toString += n + " <"+e+">";
                toString += ", "

            }
            toString = toString.substring(0, toString.length-2);
            $('#to').text(toString);
            $("#subject").text(data[0].subject);
            $(".messageBody").html(data[0].body);
            callback();
        } else {
            alert("Feed Request was invalid.");
            cyclingOn(1); // still must be able to hit 'back'
        }               
    });
}


function reply() {
    console.log("REPLY! REDIRECTING TO : "+'/compose/'+meta('boxname')+'/'+meta('uid'))
    window.location.href = '/compose/'+meta('boxname')+'/'+meta('uid');
}
