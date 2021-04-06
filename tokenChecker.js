const jwt = require('jsonwebtoken')
const config = require('./config')


module.exports = (req,res,next) => {
    const token = req.cookies.token || req.body.token || req.query.token || req.headers['x-access-token']
    const refreshToken = req.cookies.refreshToken
    // decode token
    //console.log("req.body");
    //console.log(req.body);
    
    //console.log(req.cookies.userdetails);
    //console.log(token)
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, config.secret, function(err, decodedToken) {
            //console.log('decodedToken');
            //console.log(decodedToken);
            if (err) {
               // console.log("token error");
                //console.log(err);
                
                //return res.status(401).json({"error": true, "message": 'Unauthorized access.' });
            }else{
                //console.log("token ok");
                try{
                    console.log("token ok");
                    next();
                }catch(err){
                    console.log("error");
                }
                
            }
            //req.decoded = decodedToken;
        
            // if refresh token exists
            
    
            //console.log(decoded);
        });
    } else {
        jwt.verify(refreshToken, config.refreshTokenSecret, function (err,decodedRefreshToken){
            //console.log('decodedRefreshToken');
            //console.log(decodedRefreshToken);
            if(err){
                console.log("refresh token error");
                //console.log(err)
                try{
                    //
                    console.log('error');
                    res.sendFile(__dirname + '/splash.html');
                    
                }catch(err){
                    console.log("error");
                }
            } else {
                //console.log("decodedRefreshToken");
                //console.log(decodedRefreshToken);
                //console.log(req.cookies.userdetails);
                userdetails=JSON.parse(req.cookies.userdetails);
                const token = jwt.sign(userdetails, config.secret, { expiresIn: config.tokenLife})
                const refreshToken = jwt.sign(userdetails, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife})
                const response = {
                    "token": token,
                }
                // update the token in the list
                try{
                    res.cookie('expertname',decodedRefreshToken.users_alias, { maxAge: config.refreshTokenLife });
                    res.cookie('token',token, { maxAge: config.refreshTokenLife });
                    res.cookie('refreshToken',refreshToken, { maxAge: config.refreshTokenLife });
                    //res.status(200).json(response);
                    next();
                }catch(err){
                    console.log("error");
                }
                
            }
        })
        //console.log("no token");
        //res.sendFile(__dirname + '/splash.html');
    }
}