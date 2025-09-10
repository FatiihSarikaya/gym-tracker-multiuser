// lib/mongodb.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI environment variable is not set.');

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
	// In development, use a global variable so hot reloads don't create new connections
	if (!global._mongoClientPromise) {
		client = new MongoClient(uri);
		global._mongoClientPromise = client.connect();
	}
	clientPromise = global._mongoClientPromise;
} else {
	// In production, create a new client per lambda/init, but it will be cached between invocations
	client = new MongoClient(uri);
	clientPromise = client.connect();
}

export default clientPromise;


