var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');

const port = 555;

const app = express();

app.use(express.static('public/static'))
app.use(express.static('public/views'))
app.use(express.static('public/scripts'))

app.get('/', (req, res) => {
    res.render("index.html", {status: "good"});
});
app.get('/about', (req, res) => {
    res.render("about.html", {status: "good"});
});
app.get('/contact', (req, res) => {
    res.render("contact.html", {status: "good"});
});
app.get('/resume', (req, res) => {
    res.download("Gavin Collier - Resume.pdf");
});

var server = http.createServer(app).listen(port, function () {
    console.log("Server started on " + port);
});