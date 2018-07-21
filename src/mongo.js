import { MongoClient } from 'mongodb';

const DB_NAME = 'lunch';
const DB_COLLECTION = 'ballots';
const DB_VOTE_COLLECTION = 'votes';
const MONGO_URL = 'mongodb://localhost:27017';

let db = null;

MongoClient.connect(MONGO_URL, { useNewUrlParser: true }, (err, client) => {
	if (err) return console.log('Failed to connect to MongoDB', err);
	console.log('Connected to MongoDB');
	db = client.db(DB_NAME);
	db.createCollection(DB_COLLECTION, (err) => {
		if (err) console.log('Failed to create collection', DB_COLLECTION, err);
		else db.createIndex(DB_COLLECTION, { uuid: 1, endTime: -1 });
    });
    db.createCollection(DB_VOTE_COLLECTION, (err) => {
		if (err) console.log('Failed to create collection', DB_VOTE_COLLECTION, err);
	});
});

export const insertBallotDB = (uuid, endTime, voters, restaraunts, callback) => {
    const doc = { uuid, endTime, voters, restaraunts };
    db.collection(DB_COLLECTION).insertOne(doc, callback);
};

export const getBallotDB = (uuid, callback) => {
    db.collection(DB_COLLECTION).findOne({uuid}, callback);
}

export const insertVoteDB = (name, restaurantId, ballotId, emailAddress, callback ) => {
    db.collection(DB_VOTE_COLLECTION).findOne({name, ballotId, emailAddress}, (err, doc) => {
        if(err) return callback(err);
        console.log(doc);
        if(doc)
            return db.collection(DB_VOTE_COLLECTION).update({ name, emailAddress, ballotId },{name, restaurantId, ballotId, emailAddress}, callback);
        db.collection(DB_VOTE_COLLECTION).insertOne({name, restaurantId, ballotId, emailAddress}, callback);
    })
}

export const getVotesDB = (restaurantId, ballotId, callback) => {
    db.collection(DB_VOTE_COLLECTION).countDocuments({restaurantId, ballotId}, (err, count) => {
        callback(err, count)})
};