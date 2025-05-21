const MongoClient = require('./MongoClient');
const Logger = require('./Logger');


let itemStore = {};
let dbName = "StreamAMGMetadata";
let dbTable = "metadata";


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

async function writeMetadata(id, item, successFunction, failFunction){
    if (global.noPersistence){
    	itemStore[id] = item;
        successFunction(id);
        return;
    }
    MongoClient.writeToDB(dbName, dbTable, {"_id" : parseInt(id)}, item,
		function(){
			successFunction(id);
		},
		function(error){
			failFunction(500, "DB ERROR: " + error.message);
		}
	);
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

async function deleteMetadata(id, successFunction, failFunction){
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
						successFunction();
					},
					function(error){
						failFunction(500).send("DB ERROR: " + error.message);
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