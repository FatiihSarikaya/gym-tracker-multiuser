import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../lib/db'
import Package from '../../models/Package'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect()
    if (req.method === 'GET') {
      const items = await Package.find({}).lean()
      return res.status(200).json(items)
    }
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Error in Packages/index:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


