const MongoClient = require('./MongoClient');
const redis = require('redis');
const redisClient = redis.createClient({legacyMode: true});
const RabbitClient = require('./RabbitClient');
const Logger = require('./Logger');


let itemStore = {};
let dbName = "StreamAMGMetadata";
let dbTable = "metadata";

let oneDayInSeconds = 86400;
let clientReady = false;
redisClient.on('connect', function(){
	clientReady = true;
	Logger.log('Redis Client Connected');
	Logger.log('');
});
redisClient.connect();


async function getMaxId(successFunction, failFunction){
    if (global.noPersistence){
    	let maxId = 0;
    	let keys = Object.keys(itemStore);
    	for (let index = 0; index < keys.length; index++){
    		let key = keys[index];
    		let item = itemStore[key];
    		let id = parseInt(key);
    		if (id > maxId){
    			maxId = id;
    		}
    	}
        successFunction(maxId);
        return;
    }
    MongoClient.getMaxID(dbName, dbTable,
    	function(results){
    		if (results.length == 0){
    			// empty table, so set this value to zero
    			successFunction(0);
    		}
    		else if (results.length > 1){
				failFunction(500, "DB ERROR: Multiple results returned for ID");
			}
			else {
				let result = results[0];
				successFunction(result._id);
			}
		},
		function(error){
			failFunction(500, "DB ERROR: " + error.message);
		}
	);
}

async function writeMetadata(id, action, item, successFunction, failFunction){
    if (global.noPersistence){
    	itemStore[id] = item;
        successFunction(id);
        return;
    }
    MongoClient.writeToDB(dbName, dbTable, {"_id" : parseInt(id)}, item,
		function(){
			if (!global.redisCacheEnabled){
				sendMessage(id, action, item);
				successFunction(id);
				return;
			}
			let key = "StreamAMG-metadata-" + id;
			redisClient.set(key, JSON.stringify(item), function(err, setReply){
				if (debugMode){
					Logger.log("Successfully cached metadata for '" + id + "' in Redis");
				}
				redisClient.expire(key, oneDayInSeconds);

				sendMessage(id, action, item);
				successFunction(id);
			});
		},
		function(error){
			failFunction(500, "DB ERROR: " + error.message);
		}
	);
}

function sendMessage(id, action, item){
	let messageObject = {
		"id" : id,
		"action" : action
	};
	if (item){
		messageObject.item = item;
	}
	RabbitClient.sendMessage(JSON.stringify(messageObject));
}

async function fetchMetadata(id, successFunction, failFunction){
    if (global.noPersistence){
    	let item = itemStore[id];
    	if (item){
    		successFunction(item);
    	}
    	else {
    		failFunction(404, "NOT FOUND");
    	}
        return;
    }

    if (!global.redisCacheEnabled){
    	if (debugMode){
			Logger.log("Redis cache disabled. Checking DB...");
		}
    	fetchMetadataFromDB(id, successFunction, failFunction);
    	return;
    }

    let key = "StreamAMG-metadata-" + id;
	redisClient.get(key, function(err, reply){
		if (err){
			Logger.log(err);
		}
		else if (!reply){
			if (debugMode){
				Logger.log("Could not find metadata for '" + id + "' in Redis. Checking DB...");
			}
			fetchMetadataFromDB(id, successFunction, failFunction);
		}
		else {
			if (debugMode){
				Logger.log("Found metadata for '" + id + "' in Redis");
			}

			let item = JSON.parse(reply);
			successFunction(item);
		}
	});
}

function fetchMetadataFromDB(id, successFunction, failFunction){
	MongoClient.fetchFromDB(dbName, dbTable, {"_id" : parseInt(id)},
		function(results){
			if (results.length == 0){
				failFunction(404, "NOT FOUND");
			}
			else if (results.length > 1){
				failFunction(500, "DB ERROR: Multiple results returned for ID");
			}
			else {
				let item = results[0];
				delete item._id;
				successFunction(item);
			}
		},
		function(error){
			failFunction(500, "DB ERROR: " + error.message);
		}
	);
}

async function deleteMetadata(id, action, successFunction, failFunction){
    if (global.noPersistence){
        let item = itemStore[id];
    	if (item){
    		delete itemStore[id];
    		successFunction();
    	}
    	else {
    		failFunction(404, "NOT FOUND");
    	}
        return;
    }
    MongoClient.fetchFromDB(dbName, dbTable, {"_id" : parseInt(id)},
		function(results){
			if (results.length == 0){
				failFunction(404, "NOT FOUND");
			}
			else if (results.length > 1){
				failFunction(500, "DB ERROR: Multiple results returned for ID");
			}
			else {
				MongoClient.deleteFromDB(dbName, dbTable, {"_id" : parseInt(id)},
					function(){
						if (!global.redisCacheEnabled){
							sendMessage(id, action);
							successFunction();
							return;
						}
						let key = "StreamAMG-metadata-" + id;
						redisClient.del(key, function(err, setReply){
							if (debugMode){
								Logger.log("Successfully removed cached metadata for '" + id + "' from Redis");
							}
							sendMessage(id, action);
							successFunction();
						});
					},
					function(error){
						failFunction(500, "DB ERROR: " + error.message);
					}
				);
			}
		},
		function(error){
			failFunction(500, "DB ERROR: " + error.message);
		}
	);
}


module.exports = {
    getMaxId : getMaxId,
    writeMetadata : writeMetadata,
    fetchMetadata : fetchMetadata,
    deleteMetadata : deleteMetadata
}