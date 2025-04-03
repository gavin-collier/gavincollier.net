var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');
var express = require('express');

const port = 555;

const app = express();

let reqPath = path.join(__dirname, '../public/');
app.use(express.static('public/static'));
app.use(express.static('public/views'));
app.use(express.static('public/scripts'));

app.get('/', (req, res) => {
    res.sendFile(reqPath + "/views/index.html");
});
app.get('/about', (req, res) => {
    res.sendFile(reqPath + "/views/about.html");
});
app.get('/resume', (req, res) => {
    res.download(reqPath + "/static/Gavin Collier - Resume.pdf");
});

//Lost Masquerade 
app.get('/masquerade/herald', (req, res) => {
    res.sendFile(reqPath + "/views/lostMasquerade/heraldSkillTree.html");
});

app.get('/masquerade/herald/skilltree.json', (req, res) => {
    res.sendFile(reqPath + "/static/JSON/skillTreeTest.json");
});


// Redirect 404 to home page
app.use((req, res) => {
    res.redirect('/');
});

var server = http.createServer(app).listen(port, function () {
    console.log("Server started on " + port);
});