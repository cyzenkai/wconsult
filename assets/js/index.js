var clickOrder=[];
var timeinterval=[];
var userID;
var socket;
var consultStatus;
var notification;
var inactivityTimeout = false;
var resetTimeoutOK = false;
var goReset = false;

try{
  var user=JSON.parse(getCookie('userdetails'));
  console.log(user)
  var userCN=user.users_CN;
  expertName=user.users_alias;
  localStorage.setItem('expertName',expertName);
  var userlevel=user.users_type.substr(6,1);
  var usertype=user.users_type=='RTA'?'RTA':user.users_type.substr(8);
  var userteam=user.users_team;
  var userCES=user.users_CES;
  var userLOB=user.users_LOB;
  var userCC=user.users_CC;
  var userCenter=user.users_center;
}catch(err){
}

$(document).mousemove(function (){
	resetTimeout();
});


$(function() {
  if (Notification.permission === "granted") {
		console.log("permission granted")		;
	} else{
		Notification.requestPermission().then(permission => {
			console.log("permission granted");
			
		});
	}
  
  resetTimeout();
  
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      console.log('visible');
      // The tab has become visible so clear the now-stale Notification.
      try{
        notification.close();
      }catch(err){
        
      }
  }
  
  
  
});
  
  
  console.log(userLOB.split(" ")[0]+" "+userlevel);
  switch(userLOB.split(" ")[0]+" "+userlevel){
    case "TM 1":
    case "TM 2":
    case "L2 2":$('.get-consult-l2').css('display','block');$('.get-consult-rma').css('display','block');break;
    case "CCT 1":$('.get-consult-cct').css('display','block');break;
  }

  socket = io(document.location.hostname+(document.location.port==''?"":":"+document.location.port));
  console.log(socket.id);
  socket.on('connect', () => {
    var data = {user: user, name: expertName, userID: socket.id, dateLog: new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"})};
    socket.emit('setSocketID', data);
    userID=data.userID;
    console.log(userID);
  });
  
  socket.on('duplicate window',function(){
      $('#duplicate-window').css('display','block');
      setTimeout(function(){
        console.log(document.cookie);
        document.cookie = 'token=;expires=;path=/';
        document.cookie = 'refreshToken=;expires=;path=/';
        document.cookie = 'userdetails=;expires=;path=/';
        window.open('/','_self',true);
      },5000);
  });
  
  socket.on('reload window',function(seconds){
    console.log('reload');
    //window.location.reload(true);
    showError('Reloading window in '+seconds+' seconds.',false);
    setTimeout(function(){
      location.reload(true);
    },seconds*1000);
  });
  
  socket.on('consult waiting', function(data){
    //addWaiting(type,CES,name,lob)
    console.log("add waiting");
    console.log(data);
    addWaiting(data);
  });

  socket.on('user connect',function(data){
    addOnline(data.type,data.lob,data.ces,data.name,data.lob,data.center);
    addAvailable(data);
  });

  socket.on('user list',function(data){
    data.forEach(function(user){
      addOnline(user.type,user.lob,user.ces,user.name,user.lob,user.center);
      addAvailable(user);
    })
  });
  
  socket.on('waiting list',function(data){
    data.forEach(function(user){
      addWaiting(user);
    })
  });
  
  socket.on('ongoing list',function(data){
    console.log("ongoing list");
    data.forEach(function(user){
      console.log(user);
      //if((user.consultee.ces!=userCES)&&(user.consultant.ces!=userCES)){
          addOngoing(user);  
      //}
    })
  });
  
  socket.on('add ongoing',function(data){
      addOngoing(data);
  })

  socket.on('user disconnect',function(data){
    console.log(data)
    $('.online-list-item#'+data).remove();
    $('#'+data+'.center-online-item').remove();
  });
  
  socket.on('user disconnected from room',function(user){
    clearInterval(consultStatus);
    $('#disconnectedAudio').trigger('play');
    $('#'+user.room+'-window .consult-status').text((user.consultant.ces==userCES?user.consultee.name:user.consultee.name)+" has disconnected. Waiting for reconnection.");
    consultStatus= 'reload window'
  });
  
  socket.on('user reconnected to room',function(user){
    clearInterval(consultStatus);
    $('#'+user.room+'-window .consult-status').text((user.consultant.ces==userCES?user.consultee.name:user.consultee.name)+" has reconnected.");
    $('#reconnectedAudio').trigger('play');
    consultStatus= setInterval(function(){$('#'+user.room+'-window .consult-status').text('');},5000);
  });

  socket.on('cancel consult',function(data){
    var usertype=data.type.toLowerCase();
    console.log("cancel consult from server");
    console.log('.'+usertype+'-dashboard > .waiting-list> #'+data.casenum);
    clearInterval(timeinterval[$('.'+usertype+'-dashboard > .waiting-list > #'+data.casenum+' > .duration').attr('id')]);
    $('.'+usertype+'-dashboard > .waiting-list > #'+data.casenum).remove();
  });
  
  socket.on('delete ongoing',function(room){
    if($('.ongoing-list-item#'+room).length>0){
        var randomClass=$('.ongoing-list-item#'+room).attr("class").split(/\s+/)[1];
        clearInterval(timeinterval[randomClass]);
        console.log(timeinterval[randomClass]);
        $('.ongoing-list-item#'+room).remove();
    }
  });

  socket.on('join room',function(consultData,reconnect){
    console.log("joining room");
    console.log(consultData);
    socket.emit('join room',consultData.room);
    if($('.'+consultData.room).length<1){
      newConsult(consultData,reconnect);
    }
  })
  
  socket.on('join center',function(center,reconnect){
    console.log("joining room");
    socket.emit('join room',center);
  })
  
  socket.on('consult message',function(messageData){
    console.log("message received");
    console.log(messageData);
    displayMessage(messageData.msgClass,messageData.room,messageData.name,messageData.message,messageData.ces==userCES?"":"self",messageData.timeReceive);
  })
  
  socket.on('end consult',function(consultData){
    console.log("end consult received");
    $('#'+consultData.room+'-window .consult-status').text((consultData.consultant.ces==userCES?consultData.consultee.name:consultData.consultee.name)+" has ended the consult.");
    endConsult(consultData);
  })
  
  socket.on('reject consult',function(message){
    console.log('rejecting');
    showError(message);
  })
  
  socket.on('hold consult',function(){
    console.log('hold');
    //window.location.reload(true);
    showError('Consult is on hold. Server is updating.',false);
  })
  
  socket.on('unhold consult',function(){
    console.log('unhold');
    //window.location.reload(true);
    hideError();
  })
  
  socket.on('force logout',function(){
    console.log('logout');
    //window.location.reload(true);
    $('a#logout').click();
  })
  
  socket.on('long hold',function(randomClass,timestamp){
      console.log("received long hold "+randomClass);
      rtaCallout('Long Hold',randomClass,timestamp);
  })
  
  socket.on('long call',function(randomClass,timestamp){
      rtaCallout('Long Call',randomClass,timestamp);
  })
  
  socket.on('clear outbound',function(randomClass,timestamp){
      rtaCallout('Clear Outbound',randomClass,timestamp);
  })
  
  socket.on('clear training',function(randomClass,timestamp){
      rtaCallout('Clear Training',randomClass,timestamp);
  })
  
  socket.on('over break',function(randomClass,timestamp){
      rtaCallout('Overbreak',randomClass,timestamp);
  })
  
  socket.on('unscheduled break',function(randomClass,timestamp){
      rtaCallout('Unscheduled Break',randomClass,timestamp);
  })
  
  socket.on('clear aftercall',function(randomClass,timestamp){
      rtaCallout('Clear Aftercall',randomClass,timestamp);
  })


  $(window).on("click", function(event) {
//    console.log(event.target.classList);
    if(!(event.target.parentElement.classList.contains('online-list-item')||
       event.target.classList.contains('chat-popup')||
       event.target.classList.contains('message-options-online')||
       event.target.classList.contains('team-online-arrow')||
       event.target.classList.contains('command-button')||
       event.target.classList.contains('center-online-item'))){
      $('.chat-popup').css('display','none');
      $('.command-popup').css('display','none');
      $('.rta-chat-popup').css('display','none');
      toggleTeamOnline('off');
    }
  });
  
  newCenterChat(userCenter.toLowerCase());
  
  $('#consult-entry-type').on('change',function() {
    if($('#consult-entry-type').prop('checked')){
      $('#consult-entry-reason').html('');
      $('#consult-entry-reason').append('<option value="0" selected="" class="selectheader" disabled="disabled">Select Reason</option>');
      $('#consult-entry-reason').append('<option value="Refund">Refund</option>');
      $('#consult-entry-reason').append('<option value="ATR">ATR</option>');
      $('#consult-entry-reason').append('<option value="Complaints">Complaints</option>');
      $('#consult-entry-reason').append('<option value="RMA">RMA</option>');
      $('#consult-entry-reason').append('<option value="Safety and Hazard">Safety and Hazard</option>');
      $('#consult-entry-reason').append('<option value="Litigation and Hold">Litigation and Hold</option>');
      $('#consult-entry-reason').append('<option value="File Attachment">File Attachment</option>');
    }else{
      $('#consult-entry-reason').html('');
      $('#consult-entry-reason').append('<option value="0" selected="" class="selectheader" disabled="disabled">Select Reason</option>');
      $('#consult-entry-reason').append('<option value="RMA Recommendation">RMA Recommendation</option>');
      $('#consult-entry-reason').append('<option value="Technical - Device Functionality/Features">Technical - Device Functionality/Features</option>');
      $('#consult-entry-reason').append('<option value="Technical - Installation">Technical - Installation</option>');
      $('#consult-entry-reason').append('<option value="Technical - Login Issues">Technical - Login Issues</option>');
      $('#consult-entry-reason').append('<option value="Technical - Web/App">Technical - Web/App</option>');
      $('#consult-entry-reason').append('<option value="Technical - 3rd Party Integration">Technical - 3rd Party Integration</option>');
      $('#consult-entry-reason').append('<option value="Process - ATR">Process - ATR</option><option value="Process - Safety and Hazard">Process - Safety and Hazard</option>');
      $('#consult-entry-reason').append('<option value="Process - Litigation and Hold">Process - Litigation and Hold</option>');
      $('#consult-entry-reason').append('<option value="Process - Video Retrieval">Process - Video Retrieval</option>');
      $('#consult-entry-reason').append('<option value="Subscription - Functional">Subscription - Functional</option>');
      $('#consult-entry-reason').append('<option value="Subscription - Transactional">Subscription - Transactional</option>');
      $('#consult-entry-reason').append('<option value="Subscription - Promo">Subscription - Promo</option>');
    };
  })

  $('#consult-new').on('click',function() {
    $('#consult-entry').css('display','block');
    if(userLOB.split(" ")[0]+" "+userlevel=='L2 2'){
      $('#consult-entry-type').prop('checked',true);
      $('#consult-entry-type').change();
      $('#consult-entry-type').attr('disabled','disabled');
    }else if(userLOB.split(" ")[0]+" "+userlevel=='CCT 1'){
      $('#consult-entry-type').prop('checked',false);
      $('#consult-entry-type').change();
      $('#consult-entry-type').attr('disabled','disabled');
    }
    getDataRecord('/api/devices',function(devices){
      //$("#consult_product").html('');
      $("#consult-entry-device").empty();
      $('#consult-entry-device').append(new Option('Select Device', 0, true, true));
      $('#consult-entry-device > option').attr('disabled','disabled');
      devices.sort((a, b) => (a["device_name"] > b["device_name"]) ? 1 : -1)
      devices.forEach(data => {
        //console.log(data);
        $("#consult-entry-device").append(new Option(data.device_name + "    (" + data.device_model + ")", data.device_model));
      });     
    },'');
    
    console.log("click");
  })

  $('#rma-new').on('click',function() {
    $('#rma-entry').css('display','block');
    getDataRecord('/api/devices',function(devices){
      //$("#consult_product").html('');
      $("#rma-entry-device").empty();
      $('#rma-entry-device').append(new Option('Select Device', 0, true, true));
      $('#rma-entry-device > option').attr('disabled','disabled');
      devices.sort((a, b) => (a["device_name"] > b["device_name"]) ? 1 : -1)
      devices.forEach(data => {
        //console.log(data);
        $("#rma-entry-device").append(new Option(data.device_name + "    (" + data.device_model + ")", data.device_model));
      });     
    },'');
  })

  $('#consult-close').on('click',function() {
    $('#consult-entry').css('display','none');
  })

  $('#rma-close').on('click',function() {
    $('#rma-entry').css('display','none');
  })
  
  $('#error-close').on('click',function() {
    $('#error-prompt').css('display','none');
    $('.error-prompt-message').html('');
  })
  
  $('.error-prompt-ok').on('click',function() {
    $('#error-prompt').css('display','none');
    $('.error-prompt-message').html('');
  })
  
  $('.queue-button').on('click',function(){
    //$('.subcontainer').css('z-index','19');
    $('.side-link').removeClass('active');
    $('.queue-button').addClass('active');
    showQueue();
  })
  
  $('.lobby-button').on('click',function(){
    //$('.subcontainer').css('z-index','19');
    $('.side-link').removeClass('active');
    $('.lobby-button').addClass('active');
    showLobby();
  })
  
  $('.callouts-button').on('click',function(){
    //$('.subcontainer').css('z-index','19');
    $('.side-link').removeClass('active');
    $('.callouts-button').addClass('active');
    showCallouts();
  })
  
  $('.holdConsult').on('click',function(){
    socket.emit('hold consult');
    $('.command-popup').css('display','none');
  })
  
  $('.unholdConsult').on('click',function(){
    socket.emit('unhold consult');
    $('.command-popup').css('display','none');
  })
  
  $('.reloadWindows').on('click',function(){
    socket.emit('reload windows',10);
    $('.command-popup').css('display','none');
  })
  
  $('.logoutAll').on('click',function(){
    socket.emit('logout all');
    $('.command-popup').css('display','none');
  })
  
  $('.command-button').on('click',function(){
    popupCommand();
  })
  
  $('#logout').on('click',function(){
    socket.emit('logout',userCES)
  })
  
 
//  newTeam('15124','Fearless Falcons');
//  addTeamOnline(193200,'SAMSON, JOVANNY');

//  newConsult('2103160325','RMA','42104875','CARPIO, KRISTINE JOY GERALDINO','ANGOT, CLIFFORD DACUP');
//  addOnline('voice','l1',193199,'ALAAN, JONATHAN BRIAN','VO',1);


//  var i=setInterval(function(){newConsult('2103160216','L2','4224582','ALAAN, JONATHAN BRIAN','ANGOT, CLIFFORD DACUP');clearInterval(i)},5000);
//  var d=setInterval(function(){sendMessage('2103160216','Ford','Hi! This is L2 Ford, may I have your concern?');clearInterval(d)},5001);
//  var t=setInterval(function(){displayMessage('2103160216c','2103160216','Brian','Hi, the Arlo Baby cameras of the cx constantly disconnects from the app. The cx mentioned that the device is only # feet from the repeater. Whenever he does a live stream, the devices will disconnect. Closing and opening the Arlo app fixes the issue. He already updated the Arlo app and did a reset to the devices and the issue persisted. The push to talk, record option and picture buttons will be grayed out as well and only the reset fixes the issue. Please advise.');clearInterval(t);},5002);

//  var m=setInterval(function(){newChat('2103160222','COLMENARES, ERIC CHUA');clearInterval(m)},1000);
//  var n=setInterval(function(){sendMessage('2103160222','Ford','Hi! This is L2 Ford, may I have your concern?');clearInterval(n)},2001);
//  var k=setInterval(function(){displayMessage('2103160216aa','2103160222','Brian','Hi, the Arlo Baby cameras of the cx constantly disconnects from the app. The cx mentioned that the device is only # feet from the repeater. Whenever he does a live stream, the devices will disconnect. Closing and opening the Arlo app fixes the issue. He already updated the Arlo app and did a reset to the devices and the issue persisted. The push to talk, record option and picture buttons will be grayed out as well and only the reset fixes the issue. Please advise.');clearInterval(k);},3002);
//  addAvailable('l2',193199,'ANGOT, CLIFFORD DACUP','L2',1);
//  addWaiting('l2',193199,'COLMENARES, ERIC','TM',1);
//  addOngoing('RMA','2103160237','CUNADO, JUAN PATRICK','COLMENARES, ERIC');
  $('.lobby-button').click();
  
  
});


function updateTimer(timer,startTime){
  const t = getElapsed(startTime);
//  console.log(t);
//  console.log(('0' + t.hours).slice(-2)+('0' + t.minutes).slice(-2)+('0' + t.seconds).slice(-2));
  $('.'+timer+' .duration').html(('0' + t.hours).slice(-2)+":"+('0' + t.minutes).slice(-2)+":"+('0' + t.seconds).slice(-2));
  if(($('.'+timer+' .duration').attr('id')==undefined)&&($('.'+timer+' .longConsult').hasClass('hiddenDiv'))){
      if((parseInt(('0' + t.minutes).slice(-2))>=10)&&(parseInt(('0' + t.seconds).slice(-2))>=0)){
          $('.'+timer+' .longConsult').removeClass('hiddenDiv');
      }
  }
  clearInterval(timeinterval[timer]);
  timeinterval[timer]= setInterval(function(){updateTimer(timer,startTime)},1000);
}

function getElapsed(starttime){
  var elapsed;
  var nowDate=new Date((new Date()).toLocaleString("en-US", {timeZone: "Asia/Manila"}));
  //console.log(nowDate);
  //console.log(starttime);
  var start=new Date(starttime.substr(0,4),parseInt(starttime.substr(5,2))-1,starttime.substr(8,2),starttime.substr(11,2),starttime.substr(14,2),starttime.substr(17,2),0);
  elapsed=nowDate-start;
  const seconds = (Math.floor((elapsed/1000)%60))>0?(Math.floor((elapsed/1000)%60)):0;
  const minutes = (Math.floor((elapsed/1000/60)%60))>0?(Math.floor((elapsed/1000/60)%60)):0;
  const hours = (Math.floor((elapsed/(1000*60*60))%24)>0)?(Math.floor((elapsed/(1000*60*60))%24)):0;
  const days = (Math.floor(elapsed/(1000*60*60*24)))>0?(Math.floor(elapsed/(1000*60*60*24))):0;
  
  return {
    hours,
    minutes,
    seconds
  };
}

function newCenterChat(center){
  if(!($('#'+center+'-link').length>0)){
    clickOrder.push(center);
    $('.center-link-template').clone().attr('class','center-link').attr('id',center+'-link').addClass('side-link').append('<b>'+center.toUpperCase()+' Chat</b>').appendTo('.sidebar');
    $('.subcontainer').css('z-index','19');
    $('.center-container-template').clone().attr('class','center-container').attr('id',center+'-window').addClass(center).addClass('subcontainer').appendTo('.container');

    $('.'+center+'>.center-bar>.center-input').attr('id',center).on('keyup',function(e){
      if (e.key === 'Enter' || e.keyCode === 13) {
        $('.'+center+'>.center-bar>.center-send-button').click();
      }
    });
    $('.'+center+'>.center-bar>.center-send-button').click(function(){
      if($('#'+center+'.center-input').val().trim()!==""){
        sendMessage(center,userCN,$('#'+center+'.center-input').val().trim());
      }
      $('#'+center+'.center-input').val('').focus();
    });
    $('.side-link').removeClass('active');
    $('#'+center+'-link').addClass('active');
    $('#'+center+'-link').click(function(){
      $('#'+center+'-link').removeClass('new-message');
      clickOrder.splice(clickOrder.indexOf(center),1);
      clickOrder.push(center);
      $('.subcontainer').css('z-index','19');
      $('.side-link').removeClass('active');
      $('#'+center+'-link').addClass('active');
      $('#'+center+'-window').css('z-index','20');
      $('.center-input#'+center).val('').focus();
      console.log(clickOrder);
    });
    $('.center-input#'+center).val('').focus();
  }
}

function newConsult(consultData,reconnect){
  console.log(consultData);
  if(!($('#'+consultData.room+'-link').length>0)){
    var randomClass=Math.random().toString(36).replace(/[^a-z,0-9]+/g, '').substr(0, 10);
    clickOrder.push(consultData.room);
    $('.consult-link-template').clone().attr('class','consult-link').attr('id',consultData.room+'-link').addClass('side-link').append('<b>'+consultData.type.toUpperCase()+' Consult</b><br>Case Number: '+consultData.casenum+'<br>Room: '+consultData.room+'<br>'+(consultData.consultee.ces==userCES?consultData.consultant.name:consultData.consultee.name)).appendTo('.sidebar');
    $('.subcontainer').css('z-index','19');
    $('.consult-container-template').clone().attr('class','consult-container').attr('id',consultData.room+'-window').addClass(randomClass).addClass('subcontainer').appendTo('.container');
    if(consultData.consultee.ces==userCES){
      $('.'+randomClass+'>.log-screen').remove();
      $('.'+randomClass).css('width','calc(100% - 200px)');
      $('.'+randomClass).css('margin-left','161px');
      if(!reconnect){
        sendMessage(consultData.room,consultData.consultee.name,'Hi! Requesting assistance with case number '+consultData.casenum+' with device '+consultData.device+', please see summary of case:\n'+consultData.summary);
      }
      $('#consultTakenAudio').trigger('play');
    }
    timeinterval[randomClass]= setInterval(function(){updateTimer(randomClass,consultData.consultstarted)},1000);
    if(consultData.consultant.ces==userCES){
      $('.'+randomClass+'>.log-screen #consult_casenumber').val(consultData.casenum);
      $('.'+randomClass+'>.log-screen #L2_list_consult').val(consultData.consultant.name);
      $('.'+randomClass+'>.log-screen #L1_list_consult_source').val(consultData.consultee.name);
      $('.'+randomClass+'>.log-screen #consult_invalidreason').val(consultData.reason);
      $('.'+randomClass+'>.log-screen #consult_product').val(consultData.device);
      $('.'+randomClass+'>.log-screen #consult_casenumber').attr('id','consult_casenumber-'+randomClass);
      $('.'+randomClass+'>.log-screen #L2_list_consult').attr('id','L2_list_consult-'+randomClass);
      $('.'+randomClass+'>.log-screen #L1_list_consult_source').attr('id','L1_list_consult_source-'+randomClass);
      $('.'+randomClass+'>.log-screen #consult_invalidreason').attr('id','consult_invalidreason-'+randomClass);
      $('.'+randomClass+'>.log-screen #consult_product').attr('id','consult_product-'+randomClass);
      $('.'+randomClass+'>.log-screen #consult_duation').attr('id','consult_duration-'+randomClass);
      $('.'+randomClass+'>.log-screen #consult_durationreason').attr('id','consult_durationreason-'+randomClass);
      $('.'+randomClass+'>.log-screen #consult_opportunity1').attr('id','consult_opportunity1-'+randomClass);
      $('.'+randomClass+'>.log-screen #consult_opportunity2').attr('id','consult_opportunity2-'+randomClass);
      $('.'+randomClass+'>.log-screen #consult_summary').attr('id','consult_summary-'+randomClass).html(consultData.summary);
      $('.'+randomClass+'>.log-screen [name=consult_callhandler]').prop('name','consult_callhandler-'+randomClass);
      $('.'+randomClass+'>.log-screen #consult_callhandler_na').attr('id','consult_callhandler_na-'+randomClass).prop('checked',true);
      if(consultData.type=='rma'){
        $('.'+randomClass+'>.log-screen .rmaserialnumber').removeClass('hiddenDiv');
        $('.'+randomClass+'>.log-screen #consult_serial').prop('id','consult_serial-'+randomClass);
        $('.'+randomClass+'>.log-screen #consult_serial-'+randomClass).val(consultData.serialnumber);
      }
    }



    $('.'+randomClass+'>.consult-bar>.consult-input').attr('id',consultData.room).on('keyup',function(e){
      if (e.key === 'Enter' || e.keyCode === 13) {
        $('.'+randomClass+'>.consult-bar>.consult-send-button').click();
      }
    });
    $('.'+randomClass+'>.consult-bar>.consult-send-button').click(function(){
      if($('#'+consultData.room+'.consult-input').val().trim()!==""){
        sendMessage(consultData.room,(consultData.consultee.ces==userCES?consultData.consultee.name:consultData.consultant.name),$('#'+consultData.room+'.consult-input').val().trim());
      }
      $('#'+consultData.room+'.consult-input').val('').focus();
    });
    $('.'+randomClass+'>.message-options>.message-options-transcript').click(function(){
      showTranscript(getTranscript(consultData));
    });
    $('.'+randomClass+'>.message-options>.message-options-close').click(function(){
      closeConsult(consultData);
    });
    $('.side-link').removeClass('active');
    $('#'+consultData.room+'-link').addClass('active');
    $('#'+consultData.room+'-link').click(function(){
      $('#'+consultData.room+'-link').removeClass('new-message');
      clickOrder.splice(clickOrder.indexOf(consultData.room),1);
      clickOrder.push(consultData.room);
      $('.subcontainer').css('z-index','19');
      $('.side-link').removeClass('active');
      $('#'+consultData.room+'-link').addClass('active');
      $('#'+consultData.room+'-window').css('z-index','20');
      $('.consult-input#'+consultData.room).val('').focus();
      console.log(clickOrder);
    });
    $('.consult-input#'+consultData.room).val('').focus();
  }
}

function newChat(room,CES,expert){
  console.log('newchat');
  var randomClass=Math.random().toString(36).replace(/[^a-z,0-9]+/g, '').substr(0, 10);
  clickOrder.push(room);
  $('.chat-link-template').clone().attr('class','chat-link').attr('id',room+'-link').addClass('side-link').append('<b>Chat</b><br>'+expert).appendTo('.sidebar');
  $('.subcontainer').css('z-index','19')
  $('.chat-container-template').clone().attr('class','chat-container').attr('id',room+'-window').addClass(randomClass).addClass('subcontainer').appendTo('.container');
  $('.'+randomClass+'>.chat-bar>.chat-input').attr('id',room).on('keyup',function(e){
    if (e.key === 'Enter' || e.keyCode === 13) {
      $('.'+randomClass+'>.chat-bar>.chat-send-button').click();
    }
  });
  $('.'+randomClass+'>.chat-bar>.chat-send-button').click(function(){
    if($('.chat-input#'+room).val().trim()!==""){
      sendMessage(room,expert,$('.chat-input#'+room).val().trim());
    }
    $('.chat-input#'+room).val('').focus();
  });

  $('.'+randomClass+'>.message-options>.message-options-close').click(function(){
    closeChat(room);
    console.log(clickOrder);
  });
  $('.side-link').removeClass('active');
  $('#'+room+'-link').addClass('active');
  $('#'+room+'-link').click(function(){
    clickOrder.splice(clickOrder.indexOf(room),1);
    clickOrder.push(room);
    $('.subcontainer').css('z-index','19');
    $('.side-link').removeClass('active');
    $('#'+room+'-link').addClass('active');
    $('#'+room+'-window').css('z-index','20');
    $('.chat-input#'+room).val('').focus();
    console.log(clickOrder);
  });
  $('.chat-input#'+room).val('').focus();
}

function newTeam(room,team){
  var randomClass=Math.random().toString(36).replace(/[^a-z,0-9]+/g, '').substr(0, 10);
  clickOrder.push(room);
  $('.team-link-template').clone().attr('class','chat-link').attr('id',room+'-link').addClass('side-link').append('<b>Team Chat</b><br>'+team).appendTo('.sidebar');
  $('.subcontainer').css('z-index','19')
  $('.team-container-template').clone().attr('class','team-container').attr('id',room+'-window').addClass(randomClass).addClass('subcontainer').appendTo('.container');
  $('.'+randomClass+'>.team-bar>.team-input').attr('id',room).on('keyup',function(e){
    if (e.key === 'Enter' || e.keyCode === 13) {
      $('.'+randomClass+'>.team-bar>.team-send-button').click();
    }
  });
  $('.'+randomClass+'>.teamt-bar>.team-send-button').click(function(){
    if($('.team-input#'+room).val().trim()!==""){
      sendMessage(room,'Eric',$('.team-input#'+room).val().trim());
    }
    $('.team-input#'+room).val('').focus();
  });

  $('.'+randomClass+'>.message-options>.message-options-close').click(function(){
    closeChat(room);
  });
  $('.message-options-online').click(function(){
    toggleTeamOnline();
  });
  $('.message-options-setpin').click(function(){
    setPinMessage('Welcome to our team chat saf afds dsf dsfsd fdsf dsf dsf sdfdsf sd sadf sdg sgf sdgf dsgsd gdsfg sfdg sdfg dsfg dsfgds fgdsf gfds ggfsdf sdf d');
  });
  $('.side-link').removeClass('active');
  $('#'+room+'-link').addClass('active');
  $('#'+room+'-link').click(function(){
    clickOrder.splice(clickOrder.indexOf(room),1);
    clickOrder.push(room);
    $('.subcontainer').css('z-index','19');
    $('.side-link').removeClass('active');
    $('#'+room+'-link').addClass('active');
    $('#'+room+'-window').css('z-index','20');
    $('.team-input#'+room).val('').focus();
    console.log(clickOrder);
  });
  $('.team-input#'+room).val('').focus();
}

function closeConsult(consultData){
  var randomClass=$('#'+consultData.room+'-window').attr("class").split(/\s+/)[1];
  consultData.duration=$('#'+consultData.room+'-window .duration').text();
  clearInterval(timeinterval[randomClass]);
  showTranscript(getTranscript(consultData));
  if($('#'+consultData.room+'-window .log-screen').length){
    consultData.durationreason=$('#'+consultData.room+'-window #consult_durationreason-'+randomClass).val();
    consultData.callhandler=$('#'+consultData.room+'-window input[name=consult_callhandler-'+randomClass+']:checked').val();
    consultData.opportunity1=$('#'+consultData.room+'-window #consult_opportunity1-'+randomClass).val();
    consultData.opportunity2=$('#'+consultData.room+'-window #consult_opportunity2-'+randomClass).val();
    console.log("has log screen");
  }else{
    consultData.durationreason="";
    consultData.callhandler="";
    consultData.opportunity1="";
    consultData.opportunity2="";
    console.log("has no log screen");
  }
  saveConsult(consultData.consultee.ces,consultData.consultant.ces,consultData.type,consultData.casenum,consultData.device,
               consultData.duration,consultData.durationreason,consultData.reason,consultData.callhandler,
               consultData.opportunity1,consultData.opportunity2,consultData.timestamp,consultData.summary,consultData.room,getTranscript(consultData));
  socket.emit('end consult',consultData);
  $('#'+consultData.room+'-link').remove();
  $('#'+consultData.room+'-window').remove();
  $('.subcontainer').css('z-index','19');
  console.log(clickOrder[clickOrder.length-1]);
  clickOrder.splice(clickOrder.indexOf(consultData.room),1);
  $('#'+clickOrder[clickOrder.length-1]+'-link').addClass('active');
  $('#'+clickOrder[clickOrder.length-1]+'-window').css('z-index','20');
}

function endConsult(consultData){
  $('#'+consultData.room+'-window .duration').text(consultData.duration);
  
  if($('#'+consultData.room+'-window').length>0){
    var randomClass=$('#'+consultData.room+'-window').attr("class").split(/\s+/)[1];
    $('#'+consultData.room+'-link').addClass('endedConsult');
    clearInterval(timeinterval[randomClass]);  
  }
}

function closeChat(consultData){
  //for review
  getTranscript(consultData);
  $('#'+consultData.room+'-link').remove();
  $('#'+consultData.room+'-window').remove();
  $('.subcontainer').css('z-index','19');
  console.log(clickOrder[clickOrder.length-1]);
  clickOrder.splice(clickOrder.indexOf(consultData.room),1);
  $('#'+clickOrder[clickOrder.length-1]+'-link').addClass('active');
  $('#'+clickOrder[clickOrder.length-1]+'-window').css('z-index','20');

}

function getTranscript(consultData){
  console.log(consultData);
  var content="Case Number: "+consultData.casenum+"<br>";
  content+="Summary: <br>"+consultData.summary+"<br>";
  content+="Consultant: "+consultData.consultant.name+"<br>";
  content+="Consultee: "+consultData.consultee.name+"<br>";
  content+="Request Time: "+consultData.requestTime+"<br>";
  content+="Start Time: "+consultData.consultstarted+"<br>";
  content+="Duration: "+consultData.duration+"<br><br>";
  content+="Transcript <br><br>";
  $('.'+consultData.room+'-message').each(function(message){
    content+="<b>"+$( this ).children('.message-info').children('.message-time').html()+" "+$( this ).children('.message-name').text()+"</b><br>";
    content+=$( this ).children('.message').html()+"<br>";
    //console.log(message.children('.message-name'));
    //console.log(message.children('.message-info').children('.message-time'));
    //console.log(message.children('.message'));
  })
  return content;
  
}

function sendMessage(room,name,message){
var nowDate=new Date((new Date()).toLocaleString("en-US", {timeZone: "Asia/Manila"}));
  
var nowTime=(((nowDate.getHours()>12?nowDate.getHours()-12:nowDate.getHours())<10)?('0'+(nowDate.getHours()>12?nowDate.getHours()-12:nowDate.getHours())):(nowDate.getHours()>12?nowDate.getHours()-12:nowDate.getHours()))+":"+((nowDate.getMinutes()<10)?('0'+nowDate.getMinutes()):(nowDate.getMinutes()))+":"+((nowDate.getSeconds()<10)?('0'+nowDate.getSeconds()):(nowDate.getSeconds()))+(nowDate.getHours()>12?" PM":" AM");
var randomClass=Math.random().toString(36).replace(/[^a-z,0-9]+/g, '').substr(0, 10);
var messageData={
  room:room,
  name:name,
  ces:userCES,
  message:message.replace(/\r\n|\r|\n/g,"<br />"),
  msgClass:randomClass,
}
  socket.emit('consult message',messageData);
  /*$('.message-template').clone().attr('class','message-source').addClass(randomClass).addClass(room+'-message').appendTo('#'+room+'-window');
  $('.'+randomClass+'>.message-name').html(name).addClass('hiddenDiv');
  $('.'+randomClass+'>.message').html(messageData.message);
  //$('.'+randomClass+'>.message-info>.message-status').html('Delivered');
  $('.'+randomClass+'>.message-info>.message-time').html(nowTime);
  $('.'+randomClass+'>.message-info').css('min-width',parseInt($('.'+randomClass+'>.message').css('width'))+parseInt($('.'+randomClass+'>.message').css('padding-left'))+parseInt($('.'+randomClass+'>.message').css('padding-right')));
  $('#'+room+'-window').scrollTop($('#'+room+'-window').prop("scrollHeight"));*/
}

function setPinMessage(message){
  $('.team-container .message-options-pinned').html(message);
}

function displayMessage(msgClass,room,name,message,flag,timestamp){
  console.log(flag);
  console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)
  var nowDate=new Date((timestamp).toLocaleString("en-US", {timeZone: "Asia/Manila"}));
  var nowTime=(((nowDate.getHours()>12?nowDate.getHours()-12:nowDate.getHours())<10)?('0'+(nowDate.getHours()>12?nowDate.getHours()-12:nowDate.getHours())):(nowDate.getHours()>12?nowDate.getHours()-12:nowDate.getHours()))+":"+((nowDate.getMinutes()<10)?('0'+nowDate.getMinutes()):(nowDate.getMinutes()))+":"+((nowDate.getSeconds()<10)?('0'+nowDate.getSeconds()):(nowDate.getSeconds()))+(nowDate.getHours()>12?" PM":" AM");
  console.log('#'+room+'-window');
  if(flag=="self"){
      $('.message-template').clone().attr('class','message-destination').addClass(msgClass).addClass(room+'-message').appendTo('#'+room+'-window');
      $('.'+msgClass+'>.message-name').html(name);
      $('.'+msgClass+'>.message').html(message);
      //$('.'+msgClass+'>.message-info>.message-status').html('Delivered');
      $('.'+msgClass+'>.message-info>.message-time').html(nowTime);
      $('.'+msgClass+'>.message-info').css('width',parseInt($('.'+msgClass+'>.message').css('width'))+parseInt($('.'+msgClass+'>.message').css('padding-left'))+parseInt($('.'+msgClass+'>.message').css('padding-right')));
      $('#'+room+'-window').scrollTop($('#'+room+'-window').prop("scrollHeight"));
  }else{
      $('.message-template').clone().attr('class','message-source').addClass(msgClass).addClass(room+'-message').appendTo('#'+room+'-window');
      $('.'+msgClass+'>.message-name').html(name).addClass('hiddenDiv');
      $('.'+msgClass+'>.message').html(message);
      //$('.'+msgClass+'>.message-info>.message-status').html('Delivered');
      $('.'+msgClass+'>.message-info>.message-time').html(nowTime);
      $('.'+msgClass+'>.message-info').css('min-width',parseInt($('.'+msgClass+'>.message').css('width'))+parseInt($('.'+msgClass+'>.message').css('padding-left'))+parseInt($('.'+msgClass+'>.message').css('padding-right')));
      $('#'+room+'-window').scrollTop($('#'+room+'-window').prop("scrollHeight"));
  }
  if (document.visibilityState !== 'visible') {
      console.log('invisible');
      // The tab has become visible so clear the now-stale Notification.
      try{
        $('#newMessageAudio').trigger('play');

      }catch(err){
        
      }
  }else if(!$('#'+room+'-link').hasClass('active')){
    $('#'+room+'-link').addClass('new-message');
    $('#newMessageAudio').trigger('play');

  }
  
  
}

function addWaiting(data){
  var randomClass=Math.random().toString(36).replace(/[^a-z,0-9]+/g, '').substr(0, 10);
  var lobIcon='';
  console.log(data);
  if(!($('#'+data.casenum+'.waiting-list-item').length>0)){
  $('.waiting-list-item-template').clone().attr('class','waiting-list-item').attr('id',data.casenum).addClass(randomClass).appendTo('.'+data.type.toLowerCase()+'-dashboard>.waiting-list');
  $('.'+randomClass+'>.waiting-list-item-lob').addClass('lob-'+data.lob.substr(0,2));
  if(data.ces==userCES){
    $('.'+randomClass+'>.waiting-list-item-name').html('<a href=# onclick=cancelConsult("'+data.type.toLowerCase()+'","'+data.casenum+'",$("#'+randomClass+'.duration").text()'+','+data.ces+',true)><span class="fa fa-fw fa-times-circle"></span></a>'+data.name);
  }else{
    $('.'+randomClass+'>.waiting-list-item-name').html(data.name);
  }
  $('.'+randomClass+'>.duration').attr('id',randomClass);
  console.log(data.requestTime);
  timeinterval[randomClass]= setInterval(function(){updateTimer(randomClass,data.requestTime)},1000);
  console.log(timeinterval);
  
  switch(userLOB.split(" ")[0]+" "+userlevel){
    case "TM 1":
    case "TM 2":
    case "L2 2":if(((data.type=='L2')||(data.type=='RMA'))&&(data.ces!=userCES)){
      $('.queue-button').addClass('newQueue');
      showNotification(data.type.toUpperCase()+' consult waiting','From:'+data.name+'\nReason:'+data.reason);
      $('#newConsultAudio').trigger('play');
    };
    break;
    case "CCT 1":if((data.type=='CCT')&&(data.ces!=userCES)){
      $('.queue-button').addClass('newQueue')
      showNotification(data.type.toUpperCase()+' consult waiting','From:'+data.name+'\nReason:'+data.reason)
      $('#newConsultAudio').trigger('play');
    };
    break;
  }
  }
}

function addOngoing(data){
var randomClass=Math.random().toString(36).replace(/[^a-z,0-9]+/g, '').substr(0, 10);
var nowDate=new Date;
var lobIcon='';
  console.log($('#'+data.room+'.ongoing-list.item').length);
  if(!($('#'+data.room+'.ongoing-list-item').length>0)){
  $('.ongoing-list-item-template').clone().attr('class','ongoing-list-item').attr('id',data.room).addClass(randomClass).appendTo('.ongoing-dashboard>.ongoing-list');
  $('.'+randomClass+'>.ongoing-list-item-type').html(data.type.toUpperCase()+' Consult');
  $('.'+randomClass+'>.ongoing-list-item-room').html('Room: '+data.room);
  $('.'+randomClass+'>.ongoing-list-item-consultant').html(data.consultant.name);
  $('.'+randomClass+'>.ongoing-list-item-expert').html(data.consultee.name);
  $('.'+randomClass+'>.duration').attr('id',randomClass);
  console.log(data.consultstarted);
  timeinterval[randomClass]= setInterval(function(){updateTimer(randomClass,data.consultstarted)},1000);
  }
}

function addAvailable(data){
  var randomClass=Math.random().toString(36).replace(/[^a-z,0-9]+/g, '').substr(0, 10);
  var gentype;
  var lobIcon='';
  console.log(data);
  switch(data.lob+" "+data.type){
    case 'CCT CCT':
      $('#'+data.ces+'.available-list-item').remove();
      $('.available-list-item-template').clone().attr('class','available-list-item').attr('id',data.ces).addClass(randomClass).appendTo('.cct-dashboard>.available-list');
      break;
    case 'L2 Voice' :
    case 'TM TM':
      $('#'+data.ces+'.available-list-item').remove();
      $('.available-list-item-template').clone().attr('class','available-list-item').attr('id',data.ces).addClass(randomClass).appendTo('.l2-dashboard>.available-list');
      break;
  }
  
  $('.'+randomClass+'>.available-list-item-lob').addClass('lob-'+data.lob);
  $('.'+randomClass+'>.available-list-item-number').html(data.number+'. ');
  $('.'+randomClass+'>.available-list-item-name').html(data.name);
}

function addOnline(type,subtype,CES,name,lob,center){
  $('#'+CES+'.online-list-item').remove();
  var randomClass=Math.random().toString(36).replace(/[^a-z,0-9]+/g, '').substr(0, 10);
  var gentype;
  var lobIcon='';
  console.log(type);
  switch(type){
    case "Voice":gentype="voice";break;
    case "CCT":gentype="voice";break;
    case "OS":gentype="voice";break;
    case "Chat":gentype="nonvoice";break;
    case "OTS":gentype="nonvoice";break;
    case "SME":gentype="support";break;
    case "TM":gentype="support";break;
    default:
  }
  console.log(gentype);
  console.log('.'+gentype+'-online>#'+subtype+type+'.online-list');
  $('.online-list-item-template').clone().attr('class','online-list-item').attr('id',CES).addClass(randomClass).appendTo('.'+gentype+'-online>#'+subtype+type+'.online-list');
  $('.'+randomClass+'>.online-list-item-lob').addClass('lob-'+lob);
  $('.'+randomClass+'>.online-list-item-name').html(name);
  sortList2('#'+subtype+type+'.online-list');
  if(!($('#'+CES+'.center-online-item').length>0)){
      console.log(center);
      try{
        if((center!='IOPEX')&&(center!='ARLO')){
          $('#cnx-window>.center-online').append('<div class="center-online-item" id='+CES+'>'+name+'</div>');
          sortList3('#cnx-window>.center-online');
        }else{
          $('#'+center.toLowerCase()+'-window>.center-online').append('<div class="center-online-item" id='+CES+'>'+name+'</div>');
          sortList3('#'+center.toLowerCase()+'-window>.center-online');
        }
      }catch(err){
        
      }
      console.log(userLOB);
      if(userLOB=='RTA ARLO'){
          $('#'+CES+'.center-online-item').on('click',function(event){
              popupRTA(event,CES,name);
              console.log('popping');
          })
      }
      
  }
  /*if(CES!=userCES){
    $('.'+randomClass).on('click',function(event){
      popupChat(event,CES,name);
    });
  }*/
}

function popupRTA(event,CES,name){
  var randomClass=Math.random().toString(36).replace(/[^a-z,0-9]+/g, '').substr(0, 10);
  $(".rta-chat-popup>#expert").html(name);
  $(".rta-chat-popup>#ces").html(CES);
  $(".rta-chat-popup").unbind('click');
  $('.rta-chat-popup').css('left',event.pageX);      // <<< use pageX and pageY
  $('.rta-chat-popup').css('top',event.pageY);
  $('.rta-chat-popup').css('display','inline');     
  $(".rta-chat-popup").css("position", "absolute");
  $('.rta-callout').toArray().forEach(function(callout){
      $(callout).on('click',function(){
          console.log('sending '+$(callout).attr('id'));
          socket.emit($(callout).attr('id'),CES,userCES);
          $('.rta-callout').toArray().forEach(function(callout){
              $(callout).unbind('click');
          })
      })                  
  })
  /*$(".rta-chat-popup").on('click',function(){
    $('.rta-chat-popup').css('display','none');
  });*/
}

function sortList(className){
  $(className).sort(function(a, b) {
    if (a.textContent < b.textContent) {
      return -1;
    } else {
      return 1;
    }
  }).appendTo($(className));
}

function sortList2(className){
  var listItems=$(className).children();
  $(listItems).sort(function(a, b) {
    if ($(a).children()[1].textContent < $(b).children()[1].textContent) {
      return -1;
    } else {
      return 1;
    }
  }).appendTo($(className));
}

function sortList3(className){
  var listItems=$(className).children();
  $(listItems).sort(function(a, b) {
    if (a.textContent < b.textContent) {
      return -1;
    } else {
      return 1;
    }
  }).appendTo($(className));
}

function addTeamOnline(CES,name){
  $('<div>'+name+'</div>').addClass('message-options-team-online-expert').appendTo('.team-container .message-options-team-online');
  sortList('.team-container .message-options-team-online-expert');
  console.log($('.message-options-team-online-expert'));
}

function toggleTeamOnline(status){
  if(status=='on'){
    $('.message-options-team-online').css('display','block');
    $('.message-options-online>i').removeClass('fa-caret-down').addClass('fa-caret-up');
  }else if(status=='off'){
    $('.message-options-team-online').css('display','none')
    $('.message-options-online>i').removeClass('fa-caret-up').addClass('fa-caret-down');
  }else{
    if($('.message-options-team-online').css('display')=='block'){
      $('.message-options-team-online').css('display','none')
      $('.message-options-online>i').removeClass('fa-caret-up').addClass('fa-caret-down');
    }else{
      $('.message-options-team-online').css('display','block');
      $('.message-options-online>i').removeClass('fa-caret-down').addClass('fa-caret-up');
    }
  }
}

function showQueue(){
  $('.subcontainer').css('z-index','19')
  $('.consult-link').removeClass('active');
  $('.queue-container').css('z-index','20');
  $('.queue-button').removeClass('newQueue');
}

function showLobby(){
  $('.subcontainer').css('z-index','19')
  $('.consult-link').removeClass('active');
  $('.lobby-container').css('z-index','20');
}

function showCallouts(){
  $('.subcontainer').css('z-index','19')
  $('.consult-link').removeClass('active');
  $('.callouts-container').css('z-index','20');
}

function popupChat(event,CES,name){
  var randomClass=Math.random().toString(36).replace(/[^a-z,0-9]+/g, '').substr(0, 10);
  console.log("popping");
  console.log(event.pageX);
  console.log(event.pageY);
  console.log($(".chat-popup"));
  $(".chat-popup").unbind('click');
  $('.chat-popup').css('left',event.pageX);      // <<< use pageX and pageY
  $('.chat-popup').css('top',event.pageY);
  $('.chat-popup').css('display','inline');     
  $(".chat-popup").css("position", "absolute");
  $(".chat-popup").on('click',function(){
    newChat(randomClass,CES,name);
    $('.chat-popup').css('display','none');
  });
}

function popupCommand(){
  var randomClass=Math.random().toString(36).replace(/[^a-z,0-9]+/g, '').substr(0, 10);
  console.log("popping");
  console.log(event.pageX);
  console.log(event.pageY);
  console.log($(".chat-popup"));
  $(".command-popup").unbind('click');
  $('.command-popup').css('left',event.pageX);      // <<< use pageX and pageY
  $('.command-popup').css('top',event.pageY);
  $('.command-popup').css('display','inline');     
  $(".command-popup").css("position", "absolute");
}

function clearConsultForm(){
  $('#consult-entry-casenumber').val('');
  $('#consult-entry-summary').val('');
  $('#consult-entry-reason').val('0');
  $('#consult-entry-device').val('0');
  $('#consult-entry-type').prop('checked',false);
}

function clearRMAForm(){
  $('#rma-entry-casenumber').val('');
  $('#rma-entry-summary').val('');
  $('#rma-entry-serialnumber').val('');
  $('#rma-entry-device').val('0');
  $('#rma-entry-address').prop('checked',false);
  $('#rma-entry-phone').prop('checked',false);
  $('#rma-entry-pop').prop('checked',false);
  $('#rma-entry-warranty').prop('checked',false);
}

function requestRMA(){
  clearInterval(m);
  $('#rma-entry-error').addClass('hiddenDiv');
  var error='';
  if(($('#rma-entry-casenumber').val().trim()=='')||
     ($('#rma-entry-casenumber').val().trim().length<8)||
     ($('#rma-entry-summary').val().trim()=='')||
     (!$('#rma-entry-warranty').prop('checked'))||
     ($('#rma-entry-serialnumber').val().trim()=='')||
     ($('#rma-entry-serialnumber').val().trim().length<13)||
     (!$('#rma-entry-address').prop('checked'))||
     (!$('#rma-entry-phone').prop('checked'))||
     (!$('#rma-entry-pop').prop('checked'))||
     ($('#rma-entry-device').val()==null)||
     ($('#rma-entry-device').val()=="0")){
    if(!$('#rma-entry-warranty').prop('checked')){
      error+='RMA cannot be initiated for out of warranty devices.<br>';
    }
    if(($('#rma-entry-casenumber').val().trim()=='')||($('#rma-entry-casenumber').val().trim().length<8)){
      error+='Case Number must be 8 digits long.<br>';
    }
    if(($('#rma-entry-device').val()==null)||($('#rma-entry-device').val()=='0')){
      error+='Select device to be replaced.<br>';
    }
    if(($('#rma-entry-serialnumber').val().trim()=='')||($('#rma-entry-serialnumber').val().trim().length<13)){
      error+='Serial Number must be 13 characters long.<br>';
    }    
    if(!$('#rma-entry-address').prop('checked')){
      error+='Make sure you have updated the customer\'s address.<br>';
    }
    if(!$('#rma-entry-phone').prop('checked')){
      error+='Make sure you have updated the customer\'s phone number.<br>';
    }
    if(!$('#rma-entry-pop').prop('checked')){
      error+='Make sure you have updated the device\'s place of purchase.<br>';
    }
    if($('#rma-entry-summary').val().trim()==''){
      error+='Please enter summary of the case.<br>';
    }
    $('#rma-entry-error').html(error);
    $('#rma-entry-error').removeClass('hiddenDiv');
    var m=setInterval(function(){$('#rma-entry-error').addClass('hiddenDiv');clearInterval(m)},7000);
  }else{
    var data={
      ces:userCES,
      name:userCN,
      type:'RMA',
      casenum:$('#rma-entry-casenumber').val().trim(),
      device:$('#rma-entry-device').val(),
      serialnumber:$('#rma-entry-serialnumber').val().trim().toUpperCase(),
      summary:$('#rma-entry-summary').val().trim(),
      warranty:$('#rma-entry-warranty').prop('checked')?'OOW':'IW',
      reason:'RMA Approval',
      lob:userLOB,
      usertype:usertype
    }
    socket.emit('consult request', data);
    clearRMAForm();
    $('#rma-entry').css('display','none');
  }
  console.log($('#rma-entry-summary').val());
}

function requestConsult(){
  clearInterval(m);
  $('#consult-entry-error').addClass('hiddenDiv');
  var error='';
  if(($('#consult-entry-casenumber').val().trim()=='')||
     ($('#consult-entry-casenumber').val().trim().length<8)||
     ($('#consult-entry-summary').val().trim()=='')||
     ($('#consult-entry-reason').val()==null)||
     ($('#consult-entry-reason').val()=="0")||
     ($('#consult-entry-device').val()==null)||
     ($('#consult-entry-device').val()=="0")){
    if(($('#consult-entry-casenumber').val().trim()=='')||($('#consult-entry-casenumber').val().trim().length<8)){
      error+='Case Number must be 8 digits long.<br>';
    }
    if(($('#consult-entry-device').val()==null)||($('#consult-entry-device').val()=='0')){
      error+='Select device for consult.<br>';
    }
    if(($('#consult-entry-reason').val()==null)||($('#consult-entry-reason').val()=='0')){
      error+='Select reason for consult.<br>';
    }
    if($('#consult-entry-summary').val().trim()==''){
      error+='Please enter summary of the case.<br>';
    }
    $('#consult-entry-error').html(error);
    $('#consult-entry-error').removeClass('hiddenDiv');
    var m=setInterval(function(){$('#consult-entry-error').addClass('hiddenDiv');clearInterval(m)},5000);
  }else{
    var data={
      ces:userCES,
      name:userCN,
      type:$('#consult-entry-type').prop('checked')?'CCT':'L2',
      casenum:$('#consult-entry-casenumber').val().trim(),
      reason:$('#consult-entry-reason').val(),
      device:$('#consult-entry-device').val(),
      summary:$('#consult-entry-summary').val().trim(),
      lob:userLOB,
      usertype:usertype
    }
    socket.emit('consult request', data);
    clearConsultForm();
    $('#consult-entry').css('display','none');
  }
  console.log($('#consult-entry-summary').val());
}

function getConsult(type){
  var data={
    type:type,
    ces:userCES,
    usertype:usertype,
    userlob:userLOB.split(" ")[0]
  }
  console.log('getting consult');
  socket.emit('get consult',data);
}

function cancelConsult(type,casenum,duration,ces,abandon){
  var data={
    type:type.toLowerCase(),
    casenum:casenum,
    duration:duration,
    abandon:abandon,
    ces:ces,
    reason:'Consultee Initiated'
  }
  if(data.abandon){
    socket.emit('abandon consult',data)
  }
  console.log("cancel consult");
  socket.emit('cancel consult',data)
}

function getCookie(cname) {
	//console.log(document.cookie);
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for(var i = 0; i <ca.length; i++) {
	  	var c = ca[i];
	  	while (c.charAt(0) == ' ') {
			c = c.substring(1);
	 	}
	 	if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
	  	}
	}
	return "";
}

function getDataRecord(api,callback,data){
	let xhr = new XMLHttpRequest();
	xhr.open('GET', api)
	xhr.send();
	xhr.onload = function() {
		if (xhr.status != 200) { // analyze HTTP status of the response
			console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
		} else {
			//console.log(xhr.response);
			callback(JSON.parse(xhr.response).data,data);
		}
	}
	xhr.onerror = function() {
	  console.log("Request failed");
	};
}

function saveConsult(L1,L2,type,casenumber,product,duration,durationreason,reason,callhandler,opportunity1,opportunity2,datetime,summary,room,transcript){
  var error=false;

  var data={
    L1_list_consult_source:L1,
    L2_list_consult:L2,
    consult_type:type,
    consult_casenumber:casenumber,
    consult_product:product,
    consult_duration:duration,
    consult_durationreason:durationreason,
    consult_callhandler:callhandler,
    consult_invalidreason:reason,
    consult_opportunity:opportunity1 +"=-="+ opportunity2,
    consult_timestamp:datetime,
    consult_summary:summary,
    consult_room:room,
    consult_transcript:transcript,
    consult_updatedby:$('#'+room+'-window .log-screen').length>0?"consultant":"consultee"
  }
  console.log(data);

  $.ajax({
    type:"POST",
    url:"/api/consults/update" ,
    data:JSON.stringify(data),
    headers:{
      "Content-Type":"application/json"
    },
    //dataType:"json",
    success:function(data){
      //console.log(data);
    },
    error:function(error){
      console.log(error);
    }
  });
}

function showTranscript(transcript){
	console.log(transcript);
	var htmlContent='<pre>';
	htmlContent+=transcript;
	
	htmlContent+='</pre>';
	var myWindow = window.open("", "Title", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=600,top="+0+",right="+100);
	
	myWindow.document.head.innerHTML = "<head><title>Chat Consult Transcript</title>"

	myWindow.document.body.innerHTML = htmlContent;

	myWindow.focus();

}


function showNotification(title,message) {
		notification = new Notification("Click to Open: "+title, {
		   body: message,
		   icon: "/favicon.ico",
		   requireInteraction: true 
		})
    notification.onclick = function(x) { window.focus(); $('.queue-button').click(); this.close(); };
}

function showError(message,withClose){
    if(withClose){
      $('#error-close').html('&times');
      $('.error-prompt-ok').removeClass('hiddenDiv');
    }else{
      $('#error-close').html('');
      $('.error-prompt-ok').addClass('hiddenDiv');
    }
    $('.error-prompt-message').html(message);
    $('#error-prompt').css('display','block');   
}

function hideError(){
  $('#error-prompt').css('display','none'); 
}

function rtaCallout(message,randomClass,timestamp){
    console.log(message);
    var nowDate=new Date((timestamp).toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    var nowTime=(((nowDate.getHours()>12?nowDate.getHours()-12:nowDate.getHours())<10)?('0'+(nowDate.getHours()>12?nowDate.getHours()-12:nowDate.getHours())):(nowDate.getHours()>12?nowDate.getHours()-12:nowDate.getHours()))+":"+((nowDate.getMinutes()<10)?('0'+nowDate.getMinutes()):(nowDate.getMinutes()))+":"+((nowDate.getSeconds()<10)?('0'+nowDate.getSeconds()):(nowDate.getSeconds()))+(nowDate.getHours()>12?" PM":" AM");
    $('.notification-item-template').clone().attr('class','notification-item').attr('id',randomClass).appendTo('.notification-container');
    $('#'+randomClass+'.notification-item>.notification-source').html("RTA");
    $('#'+randomClass+'.notification-item>.notification-message').html(message);
    $('#'+randomClass+'.notification-item>.notification-timestamp').html(nowTime);
    $('#'+randomClass+'.notification-item>.notification-acknowledge').on('click',function(){
        $('#'+randomClass+'.notification-item').hide('slow',function(){$('#'+randomClass+'.notification-item').remove()});
        socket.emit('acknowledged callout',randomClass);
    })
    $('#notificationAudio').trigger('play');
  
}

function onUserInactivity(){
	console.log(('Logging out.'))
	try{
		socket.emit('logout',userCES);
	}catch(err){
		console.log(err);
	}
	document.cookie = 'token=;expires=;path=/';
	document.cookie = 'refreshToken=;expires=;path=/';
	document.cookie = 'userdetails=;expires=;path=/';
	location.reload(true);
	window.open('/','_self',true);
}

function resetTimeout() {
	clearTimeout(inactivityTimeout);
	if(!goReset){
		goReset=true;
		resetTimeoutOK = setTimeout(function(){
			console.log('Resetting inactivity.');
			inactivityTimeout = setTimeout(onUserInactivity, 60 * 1000 * 60 * 2);
			goReset=false
		}, 60 * 1000 * 1);
  }
}