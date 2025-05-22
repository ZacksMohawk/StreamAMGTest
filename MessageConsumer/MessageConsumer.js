global.appType = "MessageConsumer";
global.version = "1.0.0";
global.port = 0;

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const PropertiesReader = require('properties-reader');
const https = require('https');
const app = express();
const amqp = require('amqplib/callback_api');
const Logger = require('./includes/Logger');

const defaultPort = 4000;

Logger.log();
Logger.log(fs.readFileSync('AppLogo.txt', 'utf8'));
Logger.log();
Logger.log('MessageConsumer v' + version);
Logger.log();

/**
 * Objects and Variables
 */

// command line params
let configPath;
if (process.argv.indexOf("-configPath") != -1){
	configPath = process.argv[process.argv.indexOf("-configPath") + 1];
	if (!configPath){
		Logger.log("Defaulting to local config");
		configPath = 'config.ini';
	}
}
else {
	Logger.log("Defaulting to local config");
	configPath = 'config.ini';
}
if (process.argv.indexOf("-port") != -1){
	port = process.argv[process.argv.indexOf("-port") + 1];
	if (!port){
		Logger.log("Defaulting to port " + defaultPort);
		port = defaultPort;
	}
}
else {
	Logger.log("Defaulting to port " + defaultPort);
	port = defaultPort;
}

// properties
let properties = PropertiesReader(configPath);
global.debugMode = properties.get('main.debug.mode');
let privateKey, certificate, credentials = null;
let selfSignedAllowed = false;
if (properties.get('ssl.private.key') && properties.get('ssl.certificate')){
	privateKey = fs.readFileSync(properties.get('ssl.private.key'), 'utf8');
	certificate = fs.readFileSync(properties.get('ssl.certificate'), 'utf8');
	credentials = {
		key: privateKey,
		cert: certificate
	};
	if (properties.get('ssl.allow.self.signed')){
		selfSignedAllowed = true;
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	}
}
let allowedOrigins = null;
if (properties.get('cors.allowed.origins')){
	allowedOrigins = properties.get('main.allowed.origin.file').split(',');
};
let homepageText = properties.get('page.home.text') + version;
let rabbitUrl = properties.get('rabbit.url');

const queue = 'metadata';


/**
 * API Endpoints
 */

app.get('/', function (req, res) {
	if (debugMode) {
		Logger.log("[Debug] Homepage request");
	}
	res.send(homepageText);
});

amqp.connect(rabbitUrl, function(error0, connection) {
	if (error0) {
		throw error0;
	}
	connection.createChannel(function(error1, channel) {
		if (error1) {
			throw error1;
		}

		channel.assertQueue(queue, {
			durable: false
		});

		Logger.log("Waiting for messages in queue: " + queue, "FgGreen");

		channel.consume(queue, function(msg) {
			Logger.log("Received message: " + msg.content.toString());
		},
		{
			noAck: true
		});
	});
});


/**
 * Start Server
 */

if (credentials != null){
	let httpsServer = https.createServer(credentials, app);
	module.exports = httpsServer.listen(port);
	Logger.log('HTTPS Listening on port ' + port + '...');
	if (selfSignedAllowed){
		Logger.log("WARNING: Self-signed certificates allowed");
	}
}
else {
	module.exports = app.listen(port);
	Logger.log('HTTP Listening on port ' + port + '...');
}
Logger.log();