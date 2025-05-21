global.appType = "StreamAMGApp";
global.version = "1.0.0";
global.port = 0;

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const PropertiesReader = require('properties-reader');
const https = require('https');
const app = express();
const DataClient = require('./includes/DataClient');
const Logger = require('./includes/Logger');

const defaultPort = 3000;

Logger.log();
Logger.log(fs.readFileSync('AppLogo.txt', 'utf8'));
Logger.log();
Logger.log('StreamAMGApp v' + version);
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
global.noPersistence = false;
if (process.argv.indexOf("-noPersistence") != -1){
    global.noPersistence = process.argv[process.argv.indexOf("-noPersistence") + 1] == "true";
    if (global.noPersistence){
    	Logger.log("Using 'no persistence' mode (for local dev and test)", "FgRed");
    }
}
if (!global.noPersistence){
	Logger.log("Persistence not yet implemented - defaulting to 'no persistence' mode", "FgRed");
	global.noPersistence = true;
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


/**
 * Config
 */

// allow CORS for specific situations
app.use(function (req, res, next) {
	let origin = req.headers.origin;
	if (allowedOrigins && allowedOrigins.indexOf(origin) > -1){
		res.setHeader('Access-Control-Allow-Origin', origin);
	}
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.header('Access-Control-Allow-Credentials', true);
	next();
});

// for processing POST parameters
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());


/**
 * API Endpoints
 */

// homepage
app.get('/', function (req, res) {
	if (debugMode) {
		Logger.log("[Debug] Homepage request");
	}
	res.send(homepageText);
});

// GET metadata
app.get('/metadata', function (req, res) {
	res.status(400).send("Please provide ID in path");
});

// GET metadata/:id
app.get('/metadata/:id', function (req, res) {
	if (debugMode) {
		Logger.log("[Debug] GET /metadata request");
	}

	let id = req.params.id;

	authenticate(req, res,
		function(){
			DataClient.fetchMetadata(id, 
				// successFunction
				function(results){
					res.status(200).send(results);
				},
				// failFunction
				function(errorCode, errorMessage){
					Logger.error(errorCode + " ERROR: " + errorMessage);
					res.status(errorCode).send(errorMessage);
				}
			);
		}
	);
});

// POST metadata
app.post('/metadata', function (req, res) {
	let item = req.body;
	if (!item){
		if (debugMode) {
			Logger.log("[Debug] Missing metadata in POST /metadata attempt");
		}
		res.status(400).send("Missing metadata");
		return;
	}

	authenticate(req, res,
		function(){
			validate(req, res, item, 
				function(){
					DataClient.getMaxId(
						// successFunction
						function(maxId){
							DataClient.writeMetadata(maxId + 1, item,
								// successFunction
								function(id){
									res.status(200).send({"id" : id});
								},
								// failFunction
								function(errorCode, errorMessage){
									Logger.error(errorCode + " ERROR: " + errorMessage);
									res.status(errorCode).send(errorMessage);
								}
							);
						},
						// failFunction
						function(errorCode, errorMessage){
							Logger.error(errorCode + " ERROR: " + errorMessage);
							res.status(errorCode).send(errorMessage);
						}
					);
				}
			);
		}
	);
});

// POST metadata/:id
app.post('/metadata/:id', function (req, res) {
	if (overflowDetected(req, res)){
		return;
	}

	if (debugMode) {
		Logger.log("[Debug] POST /metadata request");
	}

	let id = req.params.id;

	let item = req.body;
	if (!item){
		if (debugMode) {
			Logger.log("[Debug] Missing metadata in POST /metadata attempt");
		}
		res.status(400).send("Missing metadata");
		return;
	}

	authenticate(req, res,
		function(){
			validate(req, res, item, 
				function(){
					DataClient.writeMetadata(id, item,
						// successFunction
						function(){
							res.status(200).send("UPDATE SUCCESSFUL");
						},
						// failFunction
						function(errorCode, errorMessage){
							Logger.error(errorCode + " ERROR: " + errorMessage);
							res.status(errorCode).send(errorMessage);
						}
					);
				}
			);
		}
	);
});

// DELETE metadata
app.delete('/metadata', function (req, res) {
	res.status(400).send("Please provide ID in path");
});

// DELETE metadata/:id
app.delete('/metadata/:id', function (req, res) {
	if (debugMode) {
		Logger.log("[Debug] DELETE /metadata request");
	}

	let id = req.params.id;

	authenticate(req, res,
		function(){
			DataClient.deleteMetadata(id,
				// successFunction
				function(){
					res.status(200).send("DELETE SUCCESSFUL");
				},
				// failFunction
				function(errorCode, errorMessage){
					Logger.error(errorCode + " ERROR: " + errorMessage);
					res.status(errorCode).send(errorMessage);
				}
			);
		}
	);
});


/**
 * Functions
 */

function overflowDetected(req, res){
	if (req.body && JSON.stringify(req.body).length > 1e6) {
		res.status(413).send("PAYLOAD TOO LARGE");
		req.connection.destroy();
		return true;
	}
	return false;
}

function authenticate(req, res, successFunction){
	// TODO Implement proper authentication here
	successFunction();
}

function validate(req, res, item, successFunction){
	// TODO Implement proper validation here
	successFunction();
}


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