var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');

const port = 443;
var options = {
    key: fs.readFileSync('./ssl/privkey.pem'),
    cert: fs.readFileSync('./ssl/fullchain.pem'),
};

const app = express();
const httpApp = express(); //non-sercure server to redirect all traftic to the app server

app.use(express.static('public/static'))
app.use(express.static('public/views'))
app.use(express.static('public/scripts'))

httpApp.get("/*", function (req, res) {
    res.redirect("https://gavincollier.net");
}); //redirect non-secure trafic

app.get('/', (req, res) => {
    res.render('../public/views/pages/index');
});

http.createServer(httpApp).listen(80, function () {
    console.log("Express http redirect server listening on port 80");
});

var server = https.createServer(options, app).listen(port, function () {
    console.log("HTTPS server started on " + port);
});