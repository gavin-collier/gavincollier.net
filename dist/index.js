var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');
const port = 555;
const app = express();
app.use(express.static('public/static'));
app.use(express.static('public/views'));
app.use(express.static('public/scripts'));
app.get('/', (req, res) => {
    res.send("Hi Mom!");
});
var server = http.createServer(app).listen(port, function () {
    console.log("Server started on " + port);
});
//# sourceMappingURL=index.js.map