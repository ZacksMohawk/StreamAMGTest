const Logger = require('./Logger');


let itemStore = {};


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
}

async function writeMetadata(id, item, successFunction, failFunction){
    if (global.noPersistence){
    	itemStore[id] = item;
        successFunction(id);
        return;
    }
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
}

async function deleteMetadata(id, successFunction, failFunction){
    if (global.noPersistence){
        let item = itemStore[id];
    	if (item){
    		delete itemStore[id];
    		successFunction(item);
    	}
    	else {
    		failFunction(404, "NOT FOUND");
    	}
        return;
    }
}


module.exports = {
    getMaxId : getMaxId,
    writeMetadata : writeMetadata,
    fetchMetadata : fetchMetadata,
    deleteMetadata : deleteMetadata
}