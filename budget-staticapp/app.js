const express = require('express');
const path = require('path');
const nunjucks = require('nunjucks');
const cors = require('cors');


const app = express();
const nenv = nunjucks.configure('templates', {  // eslint-disable-line no-unused-vars
    autoescape: true,
    express: app,
    watch: true,
});


require('dotenv').load();


app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));

app.use(cors());

process.env.PWD = process.cwd();

app.use(express.static(path.join(__dirname, '/dist')));


// Settings (based on environment variables).

app.set('port', (process.env.PORT || 5000));


// Routes.

app.get(
    '/headlines/*',
    (req, res) => {
        res.sendFile(path.join(__dirname, '/dist/headlines.html'));
    }
);

app.get(
    '*',
    (req, res) => {
        res.sendFile(path.join(__dirname, '/dist/index.html'));
    }
);


// App binding to specified port.

app.listen(app.get('port'), () => {
    // eslint-disable-next-line no-console
    console.log('Budget app is running on port', app.get('port'));
});
