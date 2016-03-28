var express = require('express');
var path = require('path');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var nunjucks = require('nunjucks');

require('dotenv').load();

/*passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/"
}, function(token, refreshToken, profile, done){
    if(profile._json.domain === "yourdomain.com"){
    	return done(null, profile);
    }else{
        // fail        
        done(new Error("Invalid host domain"));
    }
}));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
*/

var app = express();

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

/*app.use(passport.initialize());
app.use(passport.session());*/

app.set('port', (process.env.PORT || 5000));


process.env.PWD = process.cwd();

app.use(express.static(__dirname + '/dist'));

var nenv = nunjucks.configure('templates', {
    autoescape: true,
    express: app,
    watch: true
});

app.get('/', 
	function(req, res) {
	    res.render('index.html', {user:'ajvestal@dallasnews.com'});
	}
);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

