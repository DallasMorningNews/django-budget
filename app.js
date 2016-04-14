var express = require('express');
var path = require('path');
var passport = require('passport');
var expressSession = require('express-session');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var nunjucks = require('nunjucks');
var cors = require('cors');
var flash = require('connect-flash');
var _ = require('underscore');

require('dotenv').load();

var app = express();

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));

app.use(cors());

process.env.PWD = process.cwd();

app.use(express.static(__dirname + '/dist'));

var nenv = nunjucks.configure('templates', {
    autoescape: true,
    express: app,
    watch: true
});


// Settings (based on environment variables).

app.set('port', (process.env.PORT || 5000));

app.set('google_auth_client_id', (process.env.GOOGLE_AUTH_CLIENT_ID || ''));  // This needs a value.
app.set('google_auth_secret_key', (process.env.GOOGLE_AUTH_SECRET_KEY || ''));  // This needs a value
app.set('google_auth_callback_url', (process.env.GOOGLE_AUTH_CALLBACK_URL || ''));  // This needs a value.


// Session, Passport and flash-messaging setup.
app.use(
    expressSession({
        secret: 'keyboard cat',
        resave: true,
        saveUninitialized: true
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// Session serializers.

passport.serializeUser(
    function(user, done) {
        done(null, user);
    }
);

passport.deserializeUser(
    function(userObj, done) {
        done(null, userObj);
    }
);


// DMN authentication strategy.

passport.use(
    'dmn-google-apps',
    new GoogleStrategy(
        {
            clientID: app.get('google_auth_client_id'),
            clientSecret: app.get('google_auth_secret_key'),
            callbackURL: app.get('google_auth_callback_url'),
            passReqToCallback: true
        },
        function(req, accessToken, refreshToken, profile, done) {
            if (!_.isUndefined(profile._json.domain) && profile._json.domain == 'dallasnews.com') {
                return done(null, profile);
            }

            return done(null, false, {
                message: "Invalid host domain."
            });
        }
    )
);


// Authentication check.

var requireLogin = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login/google');
    }
};


// Routes.

app.get(
    '/',
    requireLogin,
    function(req, res) {
        var userObj = {
            provider: req.user.provider,
            userID: req.user.id,
            email: _.find(req.user.emails, {type: 'account'}).value,
            displayName: req.user.displayName,
            nameComponents: _.clone(req.user.name)
        };

        if (
            (_.has(req.user, 'photos')) &&
            (!_.isEmpty(req.user.photos))
        ) {
            userObj.photoURL = _.find(req.user.photos, {}).value;
        }

        res.render('index.html', {
            user: JSON.stringify(userObj)
        });
    }
);

app.get(
    '/login/google',
    passport.authenticate(
        'dmn-google-apps',
        {
            scope: ['email', 'profile']
        }
    )
);

app.get(
    '/login/google/callback',
    passport.authenticate(
        'dmn-google-apps',
        {
            failureRedirect: '/login/failure',
            failureFlash: true
        }
    ),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    }
);

app.get(
    '/login/failure',
    function(req, res) {
        var pageContext = {},
            errorMessage = req.flash('error');

        if (!_.isEmpty(errorMessage)) {
            pageContext.errorMessage = JSON.stringify(errorMessage);
        }

        res.render('login-failed.html', pageContext);
    }
);


// App binding to specified port.

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
