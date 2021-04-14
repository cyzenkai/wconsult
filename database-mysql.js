var mysql = require('mysql')
var md5 = require('md5')

var db = mysql.createPool({
    //host: "localhost",
    host: "148.66.138.196",
    user: "bzwfwjlvgldh",
    password: "3m0SZ?dLZ",
    database: "ph_wings"
}); 



function findUserByCES(CES, cb) {
    return db.query(`SELECT * FROM users WHERE users_CES = ?`,[CES], (err, row) => {
        console.log(row);
        if(row===0)
            cb(err,'');
        else
            try{
                cb(err, JSON.parse(JSON.stringify(row[0])))
            }catch(err){
                console.log(err);
            }
    });
}

module.exports = db
module.exports.findUserByCES = findUserByCES;
