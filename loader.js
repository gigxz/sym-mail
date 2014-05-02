var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://chatroom.db');

// conn.query('CREATE TABLE messages ' +
// 	'(id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT, nickname TEXT, ' + 
// 	'body TEXT, time INTEGER)')
// 	.on('error', function(error) {
// 		console.log('-messages table already exists.');
// 	});

conn.query('CREATE TABLE messages ' +
	'(id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT, nickname TEXT, ' + 
	'body TEXT, time INTEGER)')
	.on('error', function(error) {
		conn.query('DROP TABLE messages')
			.on('end', function() {
				console.log('Messages table dropped.');
			});	
		conn.query('CREATE TABLE messages ' +
	'(id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT, nickname TEXT, ' + 
	'body TEXT, time INTEGER)')
			.on('end', function() {
				console.log('Messages table recreated.');
			});
	});

conn.query('CREATE TABLE rooms ' +
	'(room TEXT PRIMARY KEY)')
	.on('error', function(error) {
		conn.query('DROP TABLE rooms')
			.on('end', function() {
				console.log('Rooms table dropped.');
			});	
		conn.query('CREATE TABLE rooms ' +
	'(room TEXT PRIMARY KEY)')
			.on('end', function() {
				console.log('Rooms table recreated.');
			});
	});