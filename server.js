var bodyParser = require('body-parser');
var express = require('express');
var path = require('path');
var app = express();

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/acadgeo';

var conexao = null;

var localUrl = 'http://localhost:3000';

var findObjAccount = function(account, callback) {
	console.log('Find Account ' + account.login);
	conexao.collection('account').find({login: account.login}).toArray(function(err, objs){
		if (err) {
			callback(err);
		} else {
			callback(null, objs);
		}
	});
};

var findObjClass = function(newClass, callback) {
	conexao.collection('class').find({name: newClass.name}).toArray(function(err, objs){
		if (err) {
			callback(err);
		} else {
			callback(null, objs);
		}
	});
}

var insertObjAccount = function(obj, callback) {
	conexao.collection('account').insertOne(obj, function(err, result) {
		assert.equal(err, null);
		console.log("Inserted account.");
		if (callback) {
			callback();
		}
	});
};

var insertObjClass = function(obj, callback) {
	conexao.collection('class').insertOne(obj, function(err, result) {
		assert.equal(err, null);
		if (callback) {
			callback();
		}
	});
};

var findObjInventoryByAccount = function(account, callback) {
	console.log('Find inventory of account ' + account.name);
	conexao.collection('inventory').find({idAccount: account._id}).toArray(function(err, objs){
		if (err) {
			callback(err);
		} else {
			callback(null, objs);
		}
	});
};

var createAccountClasses = function(account, callback) {
	var accountClasses = {
		idAccount: account._id
	}
	insertObjAccountClasses(accountClasses, function() {
		findObjAccountClassesByAccount(account, callback);
	})
}

var createInventory = function(account, callback) {
	var inventory = {
		idAccount: account._id,
		weapon: {
			name: 'Small Stone',
			description: 'Small stone perfectly to throw in enemys',
			action: 'stoneItemAction',
			damageFactor: 1
		}
	}
	insertObjInventory(inventory, function() {
		findObjInventoryByAccount(account, callback);
	});
};

var acessAccount = function(account, callback) {
	console.log('Find Account ' + account.name + ' and check password');
	conexao.collection('account').find({name: account.name, password: account.password}).toArray(function(err, objs){
		if (err) {
			callback(err);
		} else {
			callback(null, objs);
		}
	});
};

var loginAccount = function(socket, account) {
	console.log('User: ' + account.name + ' |Password: ' + account.password);
	findObjAccount(account, function(err, objs) {
		console.log(objs);
		if (objs && objs.length) {
			console.log('Account already Exists... verify password');
			acessAccount(account, function(err, accounts) {
				if (accounts && accounts.length) {
					console.log('Acess accepted!');
					findObjInventoryByAccount(accounts[0], function (err, inventorys) {
						console.log('After acess accepted');
						accounts[0].inventory = inventorys[0];
						console.log(accounts);
						socket.emit('acess-accepted', accounts[0]);
					});
				} else {
					console.log('Acess denied!');
					socket.emit('acess-denied', 'Acess denied! Password or account does not match!');
				}
			});
		} else {
			/*
			console.log('New Account');
			insertObjAccount(account, function() {
				findObjAccount(account, function(err, accounts) {
					if (accounts && accounts.length) {
						console.log('Account created!');
						createInventory(accounts[0], function(err, inventorys) {
							console.log('After create inventory');
							accounts[0].inventory = inventorys[0];
							console.log(accounts);
							socket.emit('acess-accepted', accounts[0]);
						});
					} else {
						console.log('Error to create account!');
						socket.emit('acess-denied', 'Error to create account!');
					}
				});
			});
			*/
		}
	});
};

MongoClient.connect(url, function(err, db) {
	assert.equal(null, err);
	conexao = db;
});

app.set('port', 3000);

app.use(bodyParser.json());
/*
app.use(bodyParser.urlencoded({
	extended: true
}));
*/
app.use(express.static(path.join(__dirname, 'client')));

app.get('/helloworld', function (req, res) {
	res.status(200).json({msg: "Hello World"});
});

app.post('/account', function (req, res) {
	var newAccount = req.body;
	console.log(newAccount);
	findObjAccount(newAccount, function(err, objs) {
		console.log(objs);
		if (err) {
			res.status(500).json({msg: "Error creating account"});
		} else if(objs && !objs.length) {
			console.log('Creating New Account');
			insertObjAccount(newAccount, function(err, accounts) {
				findObjAccount(newAccount, function(err, accounts) {
					console.log(accounts);
					res.status(201).json(accounts[0]);
					/*
					if (accounts && accounts.length) {
						createAccountClasses(accounts[0], function(err, classes) {
							accounts[0].classes = classes[0];
							res.status(201).json(accounts[0]);
						});
					} else {
						res.status(500).json({msg: "Error creating account"});
					}
					*/
				});
			});
		} else {
			console.log('Account already exists');
			//res.status(406).send();
			res.status(406).json({msg: 'May this account is already in use.'});
		}
	});
	//res.status(200).json({msg: "Account?!"});
});

app.post('/class', function(req, res) {
	var newClass = req.body;
	findObjClass(newClass, function(err, objs) {
		if (err) {
			res.status(500).json({msg:'Error creating class'});
		} else if(objs && !objs.length) {
			insertObjClass(newClass, function() {
				findObjClass(newClass, function(err, classes) {
					res.status(201).json(classes[0]);
				})
			})
		} else {
			res.status(406).json({msg:'May this class is already in use.'});
		}
	})
});

var server = app.listen(app.get('port'), function() {
	var port = server.address().port;
	console.log('Magic happens on port ' + port);
});