import clientPromise from '../../../../lib/mongodb';

export default async function handler(req, res) {
	const client = await clientPromise;
	const db = client.db(process.env.MONGODB_DB || 'gymdb');
	const coll = db.collection('customers');

	if (req.method === 'GET') {
		const docs = await coll.find({}).toArray();
		return res.status(200).json(docs);
	}

	if (req.method === 'POST') {
		const body = req.body;
		const result = await coll.insertOne({ ...body, createdAt: new Date() });
		return res.status(201).json({ insertedId: result.insertedId });
	}

	res.setHeader('Allow', ['GET','POST']);
	res.status(405).end(`Method ${req.method} Not Allowed`);
}


