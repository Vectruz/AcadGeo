var express = require('express');
var path = require('path');
var app = express();

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/acadgeo';

var conexao = null;

var localUrl = 'http://localhost:3000';

MongoClient.connect(url, function(err, db) {
	assert.equal(null, err);
	conexao = db;
});

app.set('port', 3000);

app.use(express.static(path.join(__dirname, 'client')));

app.get('/helloworld', function (req, res) {
	res.status(200).json({msg: "Hello World"});
});

var server = app.listen(app.get('port'), function() {
	var port = server.address().port;
	console.log('Magic happens on port ' + port);
});