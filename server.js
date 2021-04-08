"use strict";
//const server = 'localhost';
//var net = require('net');

//const server = '10.54.107.206';const hostname = '10.54.107.206';
const server = 'wconsult.glitch.me';const hostname = 'wconsult.glitch.me';
//const server = '10.54.108.36';const hostname = '10.54.108.36'; 
//const server = 'ph-wings.herokuapp.com';const hostname = 'ph-wings.herokuapp.com';
var port= process.env.PORT || 50080;
const HTTP_PORT = 80;
var fs = require('fs')
var express  =  require('express');
var app  =  express();

var http = require('http').createServer(app);
var io = require('socket.io')(http);


http.listen(port, function(){
    console.log('socket io listening on port '+port);
});

const httpmetric = require('http');
var path = require("path");
const  multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})

const notifier = require('node-notifier');
 
// Object
const { readFileSync } = require('fs');
const {saveAs} = require('file-saver');
const {performance} = require('perf_hooks');

var upload = multer({ storage: storage })

const  bodyParser  =  require('body-parser');

const  jwt  =  require('jsonwebtoken');
const  bcrypt  =  require('bcryptjs'); 

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
const  router  =  express.Router();

app.set('view engine', 'pug');

const cookieParser = require('cookie-parser')

//const tokenList = {}

var db = require("./database-mysql.js")
const config = require('./config')
const checker = require('http');

var ioClient = require('socket.io-client');
var fs = require('fs')

var serveIndex = require('serve-index');
//router.use(bodyParser.urlencoded({ extended:  false }));
//router.use(bodyParser.json());

app.use('/assets',express.static(__dirname + '/assets'));
app.use('/partials',express.static(__dirname + '/partials'));
app.use('/favicon.ico',express.static(__dirname + '/favicon.ico'));
app.use('/emergency',express.static(__dirname + '/splash.html'));
app.use('/splash.html',express.static(__dirname + '/splash.html'));

app.use(bodyParser.json());
app.use(cookieParser());

app.get('/arlee',function(req,res){
    res.sendFile(__dirname + '/arlee.html');
});
app.get("/api/list/users", (req, res, next) => {
    res.json({users:users})
});

app.get("/api/list/chatusers", (req, res, next) => {
    res.json({userNames:userObject})
});

app.get("/api/list/chatusersL2", (req, res, next) => {
    res.json({userNames:userObjectL2})
});

app.get("/api/tracking/get/:type/:CES", (req, res, next) => {
    if(req.params.type=='L1'){
        var fornotify='0001';
        var sql = "select (select count(*) from consults WHERE consults_L1=? AND consults_fornotify="+fornotify+") as consult, (select count(*) from escalations WHERE escalations_L1=? AND escalations_fornotify="+fornotify+") as escalation, (select count(*) from cctosfeedback WHERE cctosfeedback_L1=? AND cctosfeedback_fornotify="+fornotify+") as cctosfeedback";
        var params = [req.params.CES,req.params.CES,req.params.CES];
    }else if(req.params.type=='L2'){
        var fornotify='0100';
        var sql = "select (select count(*) from consults WHERE consults_L2=? AND consults_fornotify="+fornotify+") as consult, (select count(*) from escalations WHERE escalations_L2=? AND escalations_fornotify="+fornotify+") as escalation, (select count(*) from cctosfeedback WHERE cctosfeedback_L2=? AND cctosfeedback_fornotify="+fornotify+") as cctosfeedback";
        var params = [req.params.CES,req.params.CES,req.params.CES];
    }else if(req.params.type=='TM'){
        var fornotify='0010';
        var sql = "select (select count(*) from consults WHERE consults_fornotify="+fornotify+" AND consults.consults_L1 in (select users.users_CES from users where users.users_team in (select users.users_team from users where users.users_CES="+req.params.CES+"))) as consult, (select count(*) from escalations WHERE escalations_fornotify="+fornotify+" AND escalations.escalations_L1 in (select users.users_CES from users where users.users_team in (select users.users_team from users where users.users_CES="+req.params.CES+"))) as escalation, (select count(*) from cctosfeedback WHERE cctosfeedback_fornotify="+fornotify+" AND cctosfeedback.cctosfeedback_L1 in (select users.users_CES from users where users.users_team in (select users.users_team from users where users.users_CES="+req.params.CES+"))) as cctosfeedback";
    }else if(req.params.type=='L2TM'){
        var fornotify='1000';
        var sql = "select (select count(*) from consults WHERE consults_fornotify="+fornotify+") as consult, (select count(*) from escalations WHERE escalations_fornotify="+fornotify+") as escalation, (select count(*) from cctosfeedback WHERE cctosfeedback_fornotify='0010') as cctosfeedback";
        var params = [];
    }else if(req.params.type=='COL1'){
        var fornotify='0001';
        var sql = "select (select count(*) from consults WHERE consults_L1=? AND consults_fornotify="+fornotify+") as consult, (select count(*) from escalations WHERE escalations_L1=? AND escalations_fornotify="+fornotify+") as escalation, (select count(*) from cctosfeedback WHERE cctosfeedback_L1=? AND cctosfeedback_fornotify="+fornotify+") as cctosfeedback";
        var params = [req.params.CES,req.params.CES,req.params.CES];
    }else if(req.params.type=='COTM'){
        var fornotify='0010';
        var sql = "select (select count(*) from consults WHERE consults_fornotify="+fornotify+" AND consults.consults_L1 in (select users.users_CES from users where users.users_team in (select users.users_team from users where users.users_CES="+req.params.CES+"))) as consult, (select count(*) from escalations WHERE escalations_fornotify="+fornotify+" AND escalations.escalations_L1 in (select users.users_CES from users where users.users_team in (select users.users_team from users where users.users_CES="+req.params.CES+"))) as escalation, (select count(*) from cctosfeedback WHERE cctosfeedback_fornotify='1000') as cctosfeedback";
        var params = [];
    }
    

    db.query(sql, params, (err, rows) => {
        if (err) {
          //res.status(400).json({"error":err.message});
          //return;
        }
        console.log(rows);
        res.json({
            "message":"success",
            "data":rows
        })
    });
});

// login

app.post("/api/recorduser", (req, res, next) => {
	//console.log(req.body);
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
	//console.log(req.connection.remoteAddress);
    var data = {
        name: req.body.name,
        ip: req.connection.remoteAddress
    }
    var sql ='INSERT INTO `usage` (usage_timestamp,usage_name, usage_ip) VALUES (?,?,?)'
    var params =[Date.now(), data.name, data.ip]
    //console.log(sql);
    console.log('in recorduser');
    
    db.query(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            console.log(err);
            return;
        }else
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
        
    });
})

app.post("/logout", (req, res, next) => {
	//console.log(req.body);
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
	//console.log(req.connection.remoteAddress);
    var data = {
        ces: req.body.ces,
        time: Date.now(),
        mode: 1
    }
    var sql ='INSERT INTO login (login_user,login_time,login_mode) VALUES (?,?,?)'
    var params =[data.ces, data.time, data.mode]
    //console.log(sql);
    db.query(sql, params, function (err, result) {
        if (err){
            console.log(err);
            return;
        }          
    });
})

// =================== consults

app.post("/api/consults/add", (req, res, next) => {
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    //console.log(req.body);
    var data = {
        consults_L1:req.body.L1_list_consult_source,
		consults_L2:req.body.L2_list_consult,
		consult_casenumber:req.body.consult_casenumber,
		consult_product:req.body.consult_product,
        consult_duration:req.body.consult_duration,
        consult_durationreason:req.body.consult_durationreason,
        consult_callhandler:req.body.consult_callhandler,
		consult_invalidreason:req.body.consult_invalidreason,
		consult_opportunity:req.body.consult_opportunity,
		consult_feedback:req.body.consult_feedback,
		consult_commitment:req.body.consult_commitment,
        consult_timestamp:req.body.consult_timestamp,
        consult_approved:0,
        consult_fornotify:'1000'
    }
    if(req.body.consult_opportunity.split('=-=')[0]=='None'){
        data.consult_fornotify='0000';
        data.consult_approved=3;
    }
    
    //console.log(data);
    var sql ='INSERT INTO consults (consults_L1,consults_L2,consults_casenumber,consults_product,consults_duration,consults_durationreason,consults_followedcallhandler,consults_reason,consults_opportunity,consults_feedback,consults_commitment,consults_timestamp,consults_approved,consults_remarks,consults_fornotify) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    var params =[data.consults_L1,data.consults_L2,data.consult_casenumber,data.consult_product,data.consult_duration,data.consult_durationreason,data.consult_callhandler,data.consult_invalidreason,data.consult_opportunity,data.consult_feedback,data.consult_commitment,data.consult_timestamp,data.consult_approved,"",data.consult_fornotify];
	//console.log(sql);
    db.query(sql, params, function (err, result) {
        if (err){
            //res.status(400).json({"error": err.message})
            console.log(err.message);
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
            
        })
        //console.log(users);
        //console.log(res.statusMessage);
        var L2TM = users.filter(function(element,index,array){
            try{
                return element.user["users_type"] == "Level 2 TM";
            }catch(error){

            }
        });
        console.log("L2TM:");
        //console.log(L2TM);

        L2TM.forEach(function(element){
            //console.log("in foreach");
            //console.log(element);
            io.to(`${element.userID}`).emit('new consult');
        });
        //console.log(L2TM);
        //console.log(users.find(o => o.user["users_type"] == "Level 2 TM"));
    });
    
})

app.post("/api/consults/update", (req, res, next) => {
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    console.log(req.body);
    var data = {
        consults_id:req.body.consult_id,
        consults_L1:req.body.L1_list_consult_source,
		consults_L2:req.body.L2_list_consult,
		consult_casenumber:req.body.consult_casenumber,
		consult_product:req.body.consult_product,
        consult_duration:req.body.consult_duration,
        consult_durationreason:req.body.consult_durationreason,
		consult_invalidreason:req.body.consult_invalidreason,
		consult_opportunity:req.body.consult_opportunity,
		consult_feedback:req.body.consult_feedback,
		consult_commitment:req.body.consult_commitment,
        consult_timestamp:req.body.consult_timestamp,
        consult_approved:0,
        consult_fornotify:'1000'
    }
    
    //console.log(data);
    var sql ='UPDATE consults SET consults_L1 = ?, consults_L2 = ?, consults_casenumber = ?, consults_product= ?, consults_duration = ?, consults_reason = ?, consults_opportunity = ?, consults_feedback = ?, consults_commitment = ?, consults_timestamp = ?, consults_approved = ?, consults_fornotify = ? WHERE consults_id = ?'
    var params =[data.consults_L1,data.consults_L2,data.consult_casenumber,data.consult_product,data.consult_duration,data.consult_invalidreason,data.consult_opportunity,data.consult_feedback,data.consult_commitment,data.consult_timestamp, data.consult_approved, data.consult_fornotify, data.consults_id];
	//console.log(sql);
    db.query(sql, params, function (err, result) {
        if (err){
            //res.status(400).json({"error": err.message})
            console.log(err.message);
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
        //console.log(res.statusMessage);
    });
})


app.get("/api/consults/get", (req, res, next) => {
    var sql = "SELECT consults_id,consults_L1,consults_L2,consults_timestamp,consults_duration,consults_durationreason,consults_casenumber,(SELECT device_name FROM devices WHERE devices.device_model=consults.consults_product) AS product, consults_reason, consults_opportunity, consults_feedback,consults_commitment, consults_approved, consults_remarks, consults_fornotify, (SELECT users_CN FROM users WHERE users.users_CES=consults.consults_L1) AS L1, (SELECT users_CN FROM users WHERE users.users_CES=consults.consults_L2) AS L2, (SELECT users_CN FROM users WHERE users.users_CES=(SELECT team_manager from teams WHERE teams.team_id=(SELECT users_team FROM users WHERE users.users_CES=consults.consults_L1))) AS TM, (SELECT users_team FROM users WHERE users.users_CES=consults.consults_L1) AS L1Team FROM consults"
    var params = []
    db.query(sql, params, (err, rows) => {
        console.log(rows);
        if (err) {
            console.log(err);
          //res.status(400).json({"error":err.message});
          //return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
    });
});

app.post("/api/consults/delete", (req, res, next) => {
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    //console.log(req.body);
    var data = {
        consults_id:req.body.consult_id,
    }
    
    console.log(data);
    var sql ='DELETE FROM `consults` WHERE `consults_id`=?'
    var params =[data.consults_id];
	//console.log(sql);
    db.query(sql, params, function (err, result) {
        if (err){
            //res.status(400).json({"error": err.message})
            console.log(err.message);
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
        //console.log(res.statusMessage);
    });
})

app.get("/api/consults/getSingle/:id", (req, res, next) => {
	var params = [req.params.id]
    var sql = "select * from consults where `consults_id` = ?"
    
    db.query(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
		//console.log(rows);
        res.json({
            "message":"success",
            "data":rows
        })
    })
});

app.post("/api/consults/approve", (req, res, next) => {
	console.log(req.body);
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
	//console.log(req.connection.remoteAddress);
    var data = {
        id: req.body.consult_id,
        fornotify: (req.body.approve<1?'0100':'0010'),
        approve: req.body.approve
    }
    var sql ='UPDATE consults set consults_approved = ?, consults_fornotify = ? WHERE consults_id=?'
    var params =[data.approve, data.fornotify, data.id]
	//console.log(sql);
    db.query(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            console.log(err);
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
        
    });
    //console.log(res);
})

app.post("/api/consults/updateRemarks", (req, res, next) => {
	console.log(req.body);
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
	//console.log(req.connection.remoteAddress);
    var data = {
        id: req.body.consult_id,
        remarks: req.body.consult_remarks,
        source: req.body.consult_remarks_source
    }
    //console.log(data.source);
    if(data.source=='L2'){
        var sql ='UPDATE consults set consults_remarks=? WHERE consults_id=?'
    } else {
        var sql ='UPDATE consults set consults_remarks=?, consults_approved="0", consults_fornotify="0100" WHERE consults_id=?'
    }
    //console.log(sql);
    var params =[data.remarks, data.id]
	//console.log(sql);
    db.query(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            console.log(err);
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
        
    });
    //console.log(res);
})

app.post("/api/consults/updateNotify", (req, res, next) => {
	console.log(req.body);
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
	//console.log(req.connection.remoteAddress);
    var data = {
        id: req.body.consult_id,
        fornotify: req.body.consult_fornotify
    }
    var sql ='UPDATE consults set consults_fornotify=? WHERE consults_id=?'
    var params =[data.fornotify, data.id]
	//console.log(sql);
    db.query(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            console.log(err);
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
        
    });
    //console.log(res);
})

app.post("/api/consults/updateCommitment", (req, res, next) => {
	console.log(req.body);
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
	//console.log(req.connection.remoteAddress);
    var data = {
        id: req.body.consult_id,
        commitment: req.body.consult_commitment
    }
    var sql ='UPDATE consults set consults_commitment=? WHERE consults_id=?'
    var params =[data.commitment, data.id]
	//console.log(sql);
    db.query(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            console.log(err);
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
        
    });
    //console.log(res);
})

app.post("/api/consults/updateFeedback", (req, res, next) => {
	console.log(req.body);
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
	//console.log(req.connection.remoteAddress);
    var data = {
        id: req.body.consult_id,
        feedback: req.body.consult_feedback
    }
    var sql ='UPDATE consults set consults_feedback=? WHERE consults_id=?'
    var params =[data.feedback, data.id]
	//console.log(sql);
    db.query(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            console.log(err);
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
        
    });
    //console.log(res);
})

app.get("/api/devices/:column/:id", (req, res, next) => {
	var params = [req.params.id]
    var sql = "select * from devices where `device_" + req.params.column + "` = ?"
    
    db.query(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
		//console.log(rows);
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

app.get("/api/devices", (req, res, next) => {
	var params = [req.params.id]
    var sql = "select * from devices"
    
    db.query(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
		//console.log(rows);
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

app.get("/api/tagging", (req, res, next) => {
	var params = [req.params.id]
    var sql = "select * from tagging"
    
    db.query(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
		//console.log(rows);
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

app.get("/api/users/:column/:id/:exclude", (req, res, next) => {
    var excludewildcard=req.params.exclude?'%'+req.params.exclude+'%':'';
	var params = [req.params.id+'%',excludewildcard]
    //console.log(params);
    var sql = "select * from users where `users_" + req.params.column + "` LIKE ? AND  `users_" + req.params.column + "` NOT LIKE ? ORDER by `users_" + req.params.column + "` ASC"
    
    db.query(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
		//console.log(rows);
        res.json({
            "message":"success",
            "data":rows
        })
    });
});

app.get("/api/users/getteam/:id", (req, res, next) => {

	var params = [req.params.id]
    //console.log(params);
    var sql = "select * from users where users_team=?";
    
    db.query(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
		//console.log(rows);
        res.json({
            "message":"success",
            "data":rows
        })
    });
});

app.get("/api/verify/:CES/:MN", (req, res, next) => {
	var params = [req.params.CES,req.params.MN]
    var sql = "select * from users where users_CES = ? and users_MN = ?"
    
    db.query(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
		//console.log(rows);
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

app.post("/api/update/user", (req, res, next) => {
	console.log(req.body);
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    var data = {
        ces:req.body.ces,
        alias: req.body.alias,
        password: req.body.password,
        hash:''
    }
    
    data.hash=bcrypt.hashSync(data.password, 10);

    var sql ='update users set users_alias=?,users_password=? where users_CES = ?'
    var params =[data.alias, data.hash, data.ces]
    db.query(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
        })
    });
})

// =================== comments

app.post("/api/newcomment/", (req, res, next) => {
	console.log(req.body);
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    var data = {
        name: req.body.name,
        comment: req.body.comment,
        
    }
    var sql ='INSERT INTO comments (comments_name, comments_comment) VALUES (?,?)'
    var params =[data.name, data.comment]
	console.log(data);
    db.query(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})

// =================== helpdesk

app.post("/api/helpdesk/ticket", (req, res, next) => {
	console.log(req.body);
    var errors=[]
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    var data = {
        ces: req.body.ces,
        station: req.body.station,
        issue: req.body.issue,
        
    }
    var sql ='INSERT INTO tickets (tickets_CES, tickets_station, tickets_issue) VALUES (?,?,?)'
    var params =[data.ces, data.station, data.issue]
	console.log(data);
    db.query(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})

app.get("/api/helpdesk/get", (req, res, next) => {
	var params = [];
    var sql = "select * from tickets ORDER BY `tickets_id` ASC"
    
    db.query(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
		//console.log(rows);
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

// =================== splash

router.post('/register', (req, res) => {
    const  name  =  req.body.name;
    const  email  =  req.body.email;
    const  password  =  bcrypt.hashSync(req.body.password);

    db.createUser([name, email, password], (err)=>{
        if(err) return  res.status(500).send("Server error!");
        findUserByEmail(email, (err, user)=>{
            if (err) return  res.status(500).send('Server error!');  
            const  expiresIn  =  24  *  60  *  60;
            const  accessToken  =  jwt.sign({ id:  user.id }, SECRET_KEY, {
                expiresIn:  expiresIn
            });
            res.status(200).send({ "user":  user, "access_token":  accessToken, "expires_in":  expiresIn          
            });
        });
    });
});




router.post('/login', (req, res) => {
    console.log("in login");
    //console.log(req.body);
    const  CES  =  req.body.CES;
    const  password  =  req.body.password;
    
    db.findUserByCES(CES, (err, user)=>{
        //console.log(err);
        if (err) return console.log('Server error!');
        if(user.length==0) {
            console.log('User not found!')
            res.status(401).send('Invalid request')
            return;
        };
        if(!user.users_password) {
            console.log('User found, but not registered!')
            res.status(401).send('Invalid request')
            return;
        };
        const  result = bcrypt.compareSync(password, user.users_password);
        if(!result) {
            console.log('Password not valid!')
            res.status(401).send('Invalid request')
            return;
        };
        

        //console.log(user);
        const token = jwt.sign(user, config.secret, { expiresIn: config.tokenLife})
        const refreshToken = jwt.sign(user, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife})
        const response = {
            "status": "Logged in",
            "token": token,
            "refreshToken": refreshToken,
            "user": user
        }
        console.log("user");
        var data = {
            ces: user.users_CES,
            time: Date.now(),
            mode: 0
        }
        var sql ='INSERT INTO login (login_user,login_time,login_mode) VALUES (?,?,?)'
        var params =[data.ces, data.time, data.mode]
        //console.log(sql);
        db.query(sql, params, function (err, result) {
            if (err){
                console.log(err);
                return;
            }          
        });
        //console.log(user);
        //tokenList[refreshToken] = response
        res.cookie('userdetails',JSON.stringify(user), { maxAge: config.refreshTokenLife });
        res.cookie('expertname',user.users_alias, { maxAge: config.refreshTokenLife });
        res.cookie('token',token, { maxAge: config.tokenLife });
        res.cookie('refreshToken',refreshToken, { maxAge: config.refreshTokenLife });
        res.status(200).json(response);
    });
}); 
/*
router.post('/token', (req,res) => {
    // refresh the damn token
    const postData = req.body
    // if refresh token exists
    if((postData.refreshToken) && (postData.refreshToken in tokenList)) {
        const user = {
            "CES": postData.CES,
            "name": postData.name
        }
        const token = jwt.sign(user, config.secret, { expiresIn: config.tokenLife})
        const response = {
            "token": token,
        }
        // update the token in the list
        tokenList[postData.refreshToken].token = token
        res.cookie('token',token, { maxAge: config.refreshTokenLife });
        res.status(200).json(response);
    } else {
        res.status(404).send('Invalid request')
    }
})
*/

app.use('/', router);

router.use(require('./tokenChecker'));

router.get('/', (req,res) => { 
    //console.log(res);
    res.render('index',{basedir: __dirname, userdetails: req.cookies.userdetails});
    //res.sendFile(__dirname + '/main.html');
})

app.all('/*', function(req, res) {
    //history.pushState("","","/");
    res.redirect("https://"+server+"/splash.html");
});


var onlineUsers=[];
var CCTWaiting=[];
var L2Waiting=[];
var RMAWaiting=[];
var ongoingConsult=[];
var socketCES;

io.on('connection', function(socket){
    //console.log(socket);
    var userID;
    var ip = socket.handshake.address;
    var traineeAvail = false;
    
    userID=socket.id;

    socket.on('setSocketID',function(data){
        var userdata={
            id:userID,
            ces:data.user.users_CES,
            name:data.user.users_CN,
            lob:data.user.users_LOB.split(" ")[0],
            type:data.user.users_type.split(" ")[2]
        }
        if(onlineUsers.findIndex(item => item.ces === userdata.ces)>=0){
            onlineUsers[onlineUsers.findIndex(item => item.ces === userdata.ces)].id=userID;
        }else{
            onlineUsers.push(userdata);
        }
        io.to(userID).emit('user list',onlineUsers);
        io.to(userID).emit('ongoing list',ongoingConsult);
        io.to(userID).emit('CCTwaiting list',CCTWaiting);
        io.to(userID).emit('L2waiting list',L2Waiting);
        io.to(userID).emit('RMAwaiting list',RMAWaiting);
        socket.broadcast.emit('user connect',userdata);
        var ongoingUser=(ongoingConsult.filter(obj => {return obj.consultant.ces === userdata.ces})).concat(ongoingConsult.filter(obj => {return obj.consultee.ces === userdata.ces}))
        console.log(ongoingUser);
        ongoingUser.forEach(function(ongoing){
            console.log("for each ongoing");
            console.log(userdata.id);
            io.to(userdata.id).emit('join room',ongoing);
            ongoing.messages.forEach(function(message){
              console.log("for each message");
              io.to(userdata.id).emit('consult message',message);
            });
        })
    })

    socket.on('disconnect', function(reason){
        console.log(reason);
        console.log(userID+" disconnected.");
        //console.log(onlineUsers[onlineUsers.findIndex(item => item.id === userID)].ces);
        if(onlineUsers.findIndex(item => item.id === userID)>=0){
            socket.broadcast.emit('user disconnect',onlineUsers[onlineUsers.findIndex(item => item.id === userID)].ces);
            onlineUsers.splice(onlineUsers.findIndex(item => item.id === userID), 1);
        }
        
    });

    socket.on('disconnect me', function(ces){
 
    })

    socket.on('consult request',function(data){
        var nowDate=new Date((new Date()).toLocaleString("en-US", {timeZone: "Asia/Manila"}));
        console.log(data);
        data.requestTime=nowDate;
        switch(data.type){
            case "CCT":if(CCTWaiting.findIndex(item => item.casenum === data.casenum)<0){
                CCTWaiting.push(data);
                io.emit('consult waiting',data);
            }else{
                io.to(socket.id).emit('reject consult','case');
            }
            break;
            case "L2":if(L2Waiting.findIndex(item => item.casenum === data.casenum)>0){
                io.to(socket.id).emit('reject consult','Consult for case number already in queue.');
            }else if(ongoingConsult.findIndex(item => item.casenum === data.casenum)>0){
                io.to(socket.id).emit('reject consult','Consult for case number ongoing.');
            }else{
                L2Waiting.push(data);
                io.emit('consult waiting',data);
            }
            break;
            case "RMA":if(RMAWaiting.findIndex(item => item.casenum === data.casenum)<0){
                RMAWaiting.push(data);
                io.emit('consult waiting',data);
            }else{
                io.to(socket.id).emit('reject consult','case');
            }
            break;
        }
        
    })

    socket.on('get consult',function(data){
        var nowDate=new Date((new Date()).toLocaleString("en-US", {timeZone: "Asia/Manila"}));
      
        console.log(nowDate);
        var randomRoom=(nowDate.getFullYear().toString())+''+((nowDate.getMonth()<9)?'0'+(nowDate.getMonth()+1):(nowDate.getMonth()+1))+''+(nowDate.getDate()<10?'0'+nowDate.getDate():nowDate.getDate())+((nowDate.getHours()<10)?'0'+(nowDate.getHours()):(nowDate.getHours())).toString()+''+((nowDate.getMinutes()<10)?'0'+(nowDate.getMinutes()):(nowDate.getMinutes())).toString()+''+((nowDate.getSeconds()<10)?'0'+(nowDate.getSeconds()):(nowDate.getSeconds())).toString();
        console.log("getting consult-server")
        console.log(data);
        console.log(L2Waiting);
        switch(data.type){
            case "l2":
                if(L2Waiting.length>0){
                    if(onlineUsers.findIndex(item => item.ces === L2Waiting[0].ces)>=0){
                        var consultPop=L2Waiting.shift();
                        console.log('consultPop')
                        console.log(consultPop);
                        console.log('L2Waiting');
                        console.log(L2Waiting);
                        randomRoom+=consultPop.ces.toString().substr(consultPop.ces.toString().length-3,3)+''+data.ces.toString().substr(data.ces.toString().length-3,3);
                        var consultData={
                          type:data.type,
                          consultee:{
                            ces:consultPop.ces,
                            name:consultPop.name
                          }, 
                          consultant:{
                            ces:data.ces,
                            name:onlineUsers[onlineUsers.findIndex(item => item.ces === data.ces)].name
                          },
                          room:randomRoom,
                          casenum:consultPop.casenum,
                          device:consultPop.device,
                          summary:consultPop.summary,
                          reason:consultPop.reason,
                          requestTime:consultPop.requestTime,
                          messages:[]
                        }
                        consultData.consultstarted=nowDate;
                        console.log(onlineUsers[onlineUsers.findIndex(item => item.ces === consultPop.ces)].id);
                        io.to(onlineUsers[onlineUsers.findIndex(item => item.ces === consultPop.ces)].id).emit('join room',consultData);
                        io.to(socket.id).emit('join room',consultData);
                        ongoingConsult.push(consultData);
                        io.emit('cancel consult',{type:consultPop.type,casenum:consultPop.casenum});
                    }
                }
            break;
            case "cct":
                if((onlineUsers.findIndex(item => item.ces === CCTWaiting[0].ces)>=0)&&(CCTWaiting.length>0)){
                    var consultPop=CCTWaiting.shift();
                    console.log('consultPop')
                    console.log(consultPop);
                    console.log('CCTWaiting');
                    console.log(CCTWaiting);
                    randomRoom+=consultPop.ces.toString().substr(consultPop.ces.toString().length-3,3)+''+data.ces.toString().substr(data.ces.toString().length-3,3);
                    var consultData={
                      type:data.type,
                      consultee:{
                        ces:consultPop.ces,
                        name:consultPop.name
                      }, 
                      consultant:{
                        ces:data.ces,
                        name:onlineUsers[onlineUsers.findIndex(item => item.ces === data.ces)].name
                      },
                      room:randomRoom,
                      casenum:consultPop.casenum,
                      device:consultPop.device,
                      summary:consultPop.summary,
                      reason:consultPop.reason,
                      requestTime:consultPop.requestTime,
                      messages:[]
                    }
                    consultData.consultstarted=nowDate;
                    console.log(onlineUsers[onlineUsers.findIndex(item => item.ces === consultPop.ces)].id);
                    io.to(onlineUsers[onlineUsers.findIndex(item => item.ces === consultPop.ces)].id).emit('join room',consultData);
                    io.to(socket.id).emit('join room',consultData);
                    ongoingConsult.push(consultData);
                    io.emit('cancel consult',{type:consultPop.type,casenum:consultPop.casenum});
                }
            break;
            case "rma":
                if((onlineUsers.findIndex(item => item.ces === RMAWaiting[0].ces)>=0)&&(RMAWaiting.length>0)){
                    var consultPop=RMAWaiting.shift();
                    console.log('consultPop')
                    console.log(consultPop);
                    console.log('RMAWaiting');
                    console.log(RMAWaiting);
                    randomRoom+=consultPop.ces.toString().substr(consultPop.ces.toString().length-3,3)+''+data.ces.toString().substr(data.ces.toString().length-3,3);
                    var consultData={
                      type:data.type,
                      consultee:{
                        ces:consultPop.ces,
                        name:consultPop.name
                      }, 
                      consultant:{
                        ces:data.ces,
                        name:onlineUsers[onlineUsers.findIndex(item => item.ces === data.ces)].name
                      },
                      room:randomRoom,
                      casenum:consultPop.casenum,
                      device:consultPop.device,
                      summary:consultPop.summary,
                      reason:consultPop.reason,
                      requestTime:consultPop.requestTime,
                      messages:[]
                    }
                    consultData.consultstarted=nowDate;
                    console.log(onlineUsers[onlineUsers.findIndex(item => item.ces === consultPop.ces)].id);
                    io.to(onlineUsers[onlineUsers.findIndex(item => item.ces === consultPop.ces)].id).emit('join room',consultData);
                    io.to(socket.id).emit('join room',consultData);
                    ongoingConsult.push(consultData);
                    io.emit('cancel consult',{type:consultPop.type,casenum:consultPop.casenum});
                }
            break;
        }
    })
    socket.on('cancel consult',function(data){
        console.log(data);
        console.log(L2Waiting);
        switch(data.type.toLowerCase()){
            case "l2":
                io.emit('cancel consult',data);
                L2Waiting.splice(L2Waiting.findIndex(item => item.casenum === data.casenum),1);
            break;
            case "cct":
                io.emit('cancel consult',data);
                CCTWaiting.splice(CCTWaiting.findIndex(item => item.casenum === data.casenum),1);
            break;
            case "rma":
                io.emit('cancel consult',data);
                RMAWaiting.splice(RMAWaiting.findIndex(item => item.casenum === data.casenum),1);
            break;
        }
        console.log(L2Waiting);
    })
    
    socket.on('join room',function(room){
        socket.join(room);
    })
  
    socket.on('consult message',function(message){
        var nowDate=new Date((new Date()).toLocaleString("en-US", {timeZone: "Asia/Manila"}));
        console.log("sending to room");
        if(ongoingConsult.findIndex(item => item.room === message.room)>=0){
            message.timeReceive=nowDate;
            ongoingConsult[ongoingConsult.findIndex(item => item.room === message.room)].messages.push(message);
            socket.to(message.room).emit('consult message',message);
        }
    })
});


//api



