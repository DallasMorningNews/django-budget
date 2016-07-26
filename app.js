var express = require('express'),
    path = require('path'),
    nunjucks = require('nunjucks'),
    cors = require('cors'),
    app = express(),
    nenv = nunjucks.configure('templates', {  // eslint-disable-line no-unused-vars
        autoescape: true,
        express: app,
        watch: true,
    });


require('dotenv').load();

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));

app.use(cors());

process.env.PWD = process.cwd();

app.use(express.static(__dirname + '/dist'));


// Settings (based on environment variables).

app.set('port', (process.env.PORT || 5000));


// Routes.

app.get(
    '/headlines/*',
    function(req, res) {
        res.sendFile(path.join(__dirname + '/templates/headline.html'));
    }
);

app.get(
    '*',
    function(req, res) {
        res.sendFile(path.join(__dirname + '/templates/budget.html'));
    }
);


// App binding to specified port.

app.listen(app.get('port'), function() {
    console.log('Node app 2 is running on port', app.get('port'));  // eslint-disable-line no-console,max-len
});
