import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
	try {
		const client = await clientPromise;
		const db = client.db(process.env.MONGODB_DB || 'gymdb');
		await db.command({ ping: 1 });
		const coll = db.collection('members');
		const result = await coll.updateOne(
			{ _id: 'init-marker' },
			{ $setOnInsert: { createdAt: new Date(), note: 'db initialized' } },
			{ upsert: true }
		);
		return res.status(200).json({ ok: 1, upserted: result.upsertedId || false });
	} catch (err) {
		return res.status(500).json({ error: err?.message || 'Unknown error' });
	}
}


