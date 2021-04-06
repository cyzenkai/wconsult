var clickOrder=[];
var timeinterval=[];
var userID;
var socket;

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
}catch(err){
}


$(function() {



  console.log(userlevel+" "+usertype);
  switch(userlevel+" "+usertype){
    case "1 TM":
    case "2 Voice":$('.get-consult-l2').css('display','block');$('.get-consult-rma').css('display','block');break;
    case "1 CCT":$('.get-consult-cct').css('display','block');
  }

  socket = io(document.location.hostname+(document.location.port==''?"":":"+document.location.port));
  console.log(socket.id);
  socket.on('connect', () => {
    data = {user: user, name: expertName, userID: socket.id, dateLog: new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"})};
    socket.emit('setSocketID', data);
    userID=data.userID;
    console.log(userID);
  });

  socket.on('consult waiting', function(data){
    //addWaiting(type,CES,name,lob)
    console.log("add waiting");
    console.log(data);
    addWaiting(data.type,data.ces,data.name,data.lob,data.casenum);
  });

  socket.on('user connect',function(data){
    addOnline(data.type,data.lob,data.ces,data.name,data.type.substr(0,2));
  });

  socket.on('user list',function(data){
    data.forEach(function(user){
      addOnline(user.type,user.lob,user.ces,user.name,user.type.substr(0,2));
    })
  });

  socket.on('user disconnect',function(data){
    console.log(data)
    $('.online-list-item#'+data).remove();
  });

  socket.on('cancel consult',function(data){
    console.log("cancel consult from server");
    console.log('.'+data.type.toLowerCase()+'-dashboard > .waiting-list> #'+data.casenum);
    $('.'+data.type.toLowerCase()+'-dashboard > .waiting-list > #'+data.casenum).remove();
  });



  $(window).on( "click", function(event) {
//    console.log(event.target.classList);
    if(!(event.target.parentElement.classList.contains('online-list-item')||
       event.target.classList.contains('chat-popup')||
       event.target.classList.contains('message-options-online')||
       event.target.classList.contains('team-online-arrow'))){
      $('.chat-popup').css('display','none');
      toggleTeamOnline('off');
    }
  });

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
    if(userlevel+" "+usertype=='2 Voice'){
      $('#consult-entry-type').prop('checked',true);
      $('#consult-entry-type').change();
      $('#consult-entry-type').prop('disabled','disabled');
    }
    getDataRecord('/api/devices',function(devices){
      //$("#consult_product").html('');
      $("#consult-entry-device").empty();
      $('#consult-entry-device').append(new Option('Select Device', 0, true, true));
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
  })

  $('#consult-close').on('click',function() {
    $('#consult-entry').css('display','none');
  })

  $('#rma-close').on('click',function() {
    $('#rma-entry').css('display','none');
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


function updateTimer(timer,room,startTime){
  const t = getElapsed(startTime);
//  console.log(t);
//  console.log(('0' + t.hours).slice(-2)+('0' + t.minutes).slice(-2)+('0' + t.seconds).slice(-2));
  $('#'+room+'>.ongoing-list-item-duration').html(('0' + t.hours).slice(-2)+":"+('0' + t.minutes).slice(-2)+":"+('0' + t.seconds).slice(-2));
  clearInterval(timeinterval[room]);
  timeinterval[room]= setInterval(function(){updateTimer(timer,room,startTime)},1000);
}

function getElapsed(starttime){
  var elapsed;
  var nowDate=new Date;
  elapsed=nowDate-starttime;
  const seconds = Math.floor((elapsed/1000)%60);
  const minutes = Math.floor((elapsed/1000/60)%60);
  const hours = Math.floor((elapsed/(1000*60*60))%24);
  const days = Math.floor(elapsed/(1000*60*60*24));
  
  return {
    hours,
    minutes,
    seconds
  };
}



function newConsult(room,type,casenum,expert,consultant){
  addOngoing(type,room,expert,consultant);
  var randomClass=Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
  clickOrder.push(room);
  $('.consult-link-template').clone().attr('class','consult-link').attr('id',room+'-link').addClass('side-link').append('<b>'+type+' Consult</b><br>Case Number: '+casenum+'<br>Room: '+room+'<br>'+expert).appendTo('.sidebar');
  $('.subcontainer').css('z-index','19');
  $('.consult-container-template').clone().attr('class','consult-container').attr('id',room+'-window').addClass(randomClass).addClass('subcontainer').appendTo('.container');
  $('.'+randomClass+'>.consult-bar>.consult-input').attr('id',room).on('keyup',function(e){
    if (e.key === 'Enter' || e.keyCode === 13) {
      $('.'+randomClass+'>.consult-bar>.consult-send-button').click();
    }
  });
  $('.'+randomClass+'>.consult-bar>.consult-send-button').click(function(){
    if($('#'+room+'.consult-input').val().trim()!==""){
      sendMessage(room,'Eric',$('#'+room+'.consult-input').val().trim());
    }
    $('#'+room+'.consult-input').val('').focus();
  });
  $('.'+randomClass+'>.message-options>.message-options-transcript').click(function(){
    getTranscript(room);
  });
  $('.'+randomClass+'>.message-options>.message-options-close').click(function(){
    closeConsult(room);
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
    $('.consult-input#'+room).val('').focus();
    console.log(clickOrder);
  });
  $('.consult-input#'+room).val('').focus();
}

function newChat(room,CES,expert){
  var randomClass=Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
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
  var randomClass=Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
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

function closeConsult(room){
  getTranscript(room);
  $('#'+room+'-link').remove();
  $('#'+room+'-window').remove();
  $('.subcontainer').css('z-index','19');
  console.log(clickOrder[clickOrder.length-1]);
  clickOrder.splice(clickOrder.indexOf(room),1);
  $('#'+clickOrder[clickOrder.length-1]+'-link').addClass('active');
  $('#'+clickOrder[clickOrder.length-1]+'-window').css('z-index','20');
}

function closeChat(room){
  getTranscript(room);
  $('#'+room+'-link').remove();
  $('#'+room+'-window').remove();
  $('.subcontainer').css('z-index','19');
  console.log(clickOrder[clickOrder.length-1]);
  clickOrder.splice(clickOrder.indexOf(room),1);
  $('#'+clickOrder[clickOrder.length-1]+'-link').addClass('active');
  $('#'+clickOrder[clickOrder.length-1]+'-window').css('z-index','20');

}

function getTranscript(room){
  console.log("getting transcript for "+room);
}

function sendMessage(room,name,message){
var nowDate=new Date;
var nowTime=(nowDate.getHours()>12?nowDate.getHours()-12:nowDate.getHours())+":"+nowDate.getMinutes()+(nowDate.getHours()>12?" PM":" AM");
var randomClass=Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
  $('.message-template').clone().attr('class','message-source').attr('id',room+'-message').addClass(randomClass).appendTo('#'+room+'-window');
  $('.'+randomClass+'>.message').html(message);
  $('.'+randomClass+'>.message-info>.message-status').html('Delivered');
  $('.'+randomClass+'>.message-info>.message-time').html(nowTime);
  $('.'+randomClass+'>.message-info').css('min-width',parseInt($('.'+randomClass+'>.message').css('width'))+parseInt($('.'+randomClass+'>.message').css('padding-left'))+parseInt($('.'+randomClass+'>.message').css('padding-right')));
  $('#'+room+'-window').scrollTop($('#'+room+'-window').prop("scrollHeight"));
}

function setPinMessage(message){
  $('.team-container .message-options-pinned').html(message);
}

function displayMessage(msgClass,room,name,message){
var nowDate=new Date;
var nowTime=(nowDate.getHours()>12?nowDate.getHours()-12:nowDate.getHours())+":"+nowDate.getMinutes()+(nowDate.getHours()>12?" PM":" AM");

  $('.message-template').clone().attr('class','message-destination').attr('id',room+'-message').addClass(msgClass).appendTo('#'+room+'-window');
  $('.'+msgClass+'>.message-name').html(name);
  $('.'+msgClass+'>.message').html(message);
  $('.'+msgClass+'>.message-info>.message-status').html('Delivered');
  $('.'+msgClass+'>.message-info>.message-time').html(nowTime);
  $('.'+msgClass+'>.message-info').css('width',parseInt($('.'+msgClass+'>.message').css('width'))+parseInt($('.'+msgClass+'>.message').css('padding-left'))+parseInt($('.'+msgClass+'>.message').css('padding-right')));
  $('#'+room+'-window').scrollTop($('#'+room+'-window').prop("scrollHeight"));
}

function addAvailable(type,CES,name,lob,number){
var randomClass=Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);

  $('.available-list-item-template').clone().attr('class','available-list-item').attr('id',CES).addClass(randomClass).appendTo('.'+type.toLowerCase()+'-dashboard>.available-list');
  $('.'+randomClass+'>.available-list-item-lob').addClass('lob-'+lob);
  $('.'+randomClass+'>.available-list-item-number').html(number+'. ');
  $('.'+randomClass+'>.available-list-item-name').html(name);
}

function addWaiting(type,CES,name,lob,casenum){
var randomClass=Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
var lobIcon='';
console.log('.'+type+'-dashboard>.waiting-list');
  $('.waiting-list-item-template').clone().attr('class','waiting-list-item').attr('id',casenum).addClass(randomClass).appendTo('.'+type.toLowerCase()+'-dashboard>.waiting-list');
  $('.'+randomClass+'>.waiting-list-item-lob').addClass('lob-'+lob);
  if(CES==userCES){
    $('.'+randomClass+'>.waiting-list-item-name').html('<a href=# onclick=cancelConsult("'+type+'","'+casenum+'")><span class="fa fa-fw fa-times-circle"></span></a>'+name);
  }else{
    $('.'+randomClass+'>.waiting-list-item-name').html(name);
  }
}

function addOngoing(type,room,consultant,expert){
var randomClass=Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
var nowDate=new Date;
var lobIcon='';
  $('.ongoing-list-item-template').clone().attr('class','ongoing-list-item').attr('id',room).addClass(randomClass).appendTo('.ongoing-dashboard>.ongoing-list');
  $('.'+randomClass+'>.ongoing-list-item-type').html(type+' Consult');
  $('.'+randomClass+'>.ongoing-list-item-room').html('Room: '+room);
  $('.'+randomClass+'>.ongoing-list-item-consultant').html(consultant);
  $('.'+randomClass+'>.ongoing-list-item-expert').html(expert);
  timeinterval[room]= setInterval(function(){updateTimer(randomClass,room,nowDate)},1000);
}

function addOnline(type,subtype,CES,name,lob){
  console.log(type,subtype,CES,name,lob);
  if($('#'+CES).hasClass('online-list-item')){
    $('.online-list-item#'+CES).remove();
  }
  var randomClass=Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
  var gentype;
  var lobIcon='';
  switch(type){
    case "Voice":gentype="voice";break;
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
  if(CES!=userCES){
    $('.'+randomClass).click(function(event){
      popupChat(event,CES,name);
    });
  }
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
}

function showLobby(){
  console.log($('.container>.subcontainer').css('z-index'));
  $('.subcontainer').css('z-index','19')
  $('.consult-link').removeClass('active');
  $('.lobby-container').css('z-index','20');
}

function popupChat(event,CES,name){
  var randomClass=Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
  console.log("popping");
  console.log(event.pageX);
  console.log(event.pageY);
  $('.chat-popup').css('left',event.pageX);      // <<< use pageX and pageY
  $('.chat-popup').css('top',event.pageY);
  $('.chat-popup').css('display','inline');     
  $(".chat-popup").css("position", "absolute");
  $(".chat-popup").click(function(){
    newChat(randomClass,CES,name);
    $('.chat-popup').css('display','none');
  });
}

function clearConsultForm(){
  $('#consult-entry-casenumber').val('');
  $('#consult-entry-summary').val('');
  $('#consult-entry-reason').val('0');
  $('#consult-entry-device').val('0');
  $('#consult-entry-device').val('0');
  $('#consult-entry-type').prop('checked',false);
}

function requestConsult(){
  if(($('#consult-entry-casenumber').val().trim()=='')||
     ($('#consult-entry-casenumber').val().trim().length<8)||
     ($('#consult-entry-summary').val().trim()=='')||
     ($('#consult-entry-reason').val()==null)||
     ($('#consult-entry-device').val()==null)){
    $('#consult-entry-error').removeClass('hiddenDiv');
    var m=setInterval(function(){$('#consult-entry-error').addClass('hiddenDiv');},5000);
  }else{
    data={
      ces:userCES,
      name:userCN,
      type:$('#consult-entry-type').prop('checked')?'CCT':'L2',
      casenum:$('#consult-entry-casenumber').val().trim(),
      reason:$('#consult-entry-reason').val(),
      device:$('#consult-entry-device').val(),
      summary:$('#consult-entry-summary').val().trim(),
      lob:userLOB
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
    ces:userCES
  }
  socket.emit('get consult',data);
}

function cancelConsult(type,casenum){
  var data={
    type:type,
    casenum:casenum
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