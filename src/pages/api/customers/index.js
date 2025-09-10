// This example route is no longer needed. Keeping file temporarily to avoid 404s if referenced.
// You can safely delete the `pages/api/customers` directory once confirmed unused.
export default function handler(req, res) {
	res.status(410).json({ message: 'customers API was example-only and has been removed.' });
}


