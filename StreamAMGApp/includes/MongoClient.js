const Logger = require('./Logger');
let MongoClient = require('mongodb').MongoClient;


async function getMaxID(dbName, collectionName, successFunction, failFunction){
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(global.mongoBaseURL);

    try {
        await client.connect();

        const db = client.db(dbName);

        let collection = db.collection(collectionName);

        try {
            let maxID = await collection.find().sort({_id:-1}).limit(1).toArray();
            successFunction(maxID);
        }
        catch (error){
            Logger.error(error.message);
            failFunction(error);
        }
    }
    catch (error) {
        Logger.error(error.message);
        failFunction(error);
    }
    finally {
        await client.close();
    }
}

async function writeToDB(dbName, collectionName, query, entry, successFunction, failFunction){
    if (global.noPersistence){
        successFunction();
        return;
    }

    const { MongoClient } = require('mongodb');
    const client = new MongoClient(global.mongoBaseURL);

    try {
        await client.connect();

        const db = client.db(dbName);

        let collection = db.collection(collectionName);

        try {
            await collection.replaceOne(query, entry, {upsert: true});
            successFunction();
        }
        catch (error){
            Logger.error(error.message);
            failFunction(error);
        }
    }
    catch (error) {
        Logger.error(error.message);
        failFunction(error);
    }
    finally {
        await client.close();
    }
}

async function fetchFromDB(dbName, collectionName, query, successFunction, failFunction){
    if (global.noPersistence){
        successFunction([]);
        return;
    }

    const { MongoClient } = require('mongodb');
    const client = new MongoClient(global.mongoBaseURL);

    try {
        await client.connect();

        const db = client.db(dbName);

        let collection = db.collection(collectionName);

        try {
            let results = await collection.find(query).toArray();
            successFunction(results);
        }
        catch (error){
            Logger.error(error.message);
            failFunction(error);
        }
    }
    catch (error) {
        Logger.error(error.message);
        failFunction(error);
    }
    finally {
        await client.close();
    }
}

async function deleteFromDB(dbName, collectionName, query, successFunction, failFunction){
    if (global.noPersistence){
        successFunction();
        return;
    }

    const { MongoClient } = require('mongodb');
    const client = new MongoClient(global.mongoBaseURL);

    try {
        await client.connect();

        const db = client.db(dbName);

        let collection = db.collection(collectionName);

        try {
            await collection.deleteOne(query);
            successFunction();
        }
        catch (error){
            Logger.error(error.message);
            failFunction(error);
        }
    }
    catch (error) {
        Logger.error(error.message);
        failFunction(error);
    }
    finally {
        await client.close();
    }
}


module.exports = {
    getMaxID : getMaxID,
    writeToDB : writeToDB,
    fetchFromDB : fetchFromDB,
    deleteFromDB : deleteFromDB
}