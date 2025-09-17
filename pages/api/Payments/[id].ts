import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Payment from '@/models/Payment'
import { requireAuth } from '@/lib/session'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireAuth(req, res)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await dbConnect()
    const id = Number(req.query.id)
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' })

    if (req.method === 'GET') {
      const item = await Payment.findOne({ userId: user.id, id }).lean()
      if (!item) return res.status(404).json({ message: 'Payment not found' })
      return res.status(200).json(item)
    }

    if (req.method === 'PUT') {
      const updated = await Payment.findOneAndUpdate({ userId: user.id, id }, { ...req.body }, { new: false })
      if (!updated) return res.status(404).json({ message: 'Payment not found' })
      return res.status(204).end()
    }

    if (req.method === 'DELETE') {
      const result = await Payment.deleteOne({ userId: user.id, id })
      if (result.deletedCount === 0) return res.status(404).json({ message: 'Payment not found' })
      return res.status(204).end()
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Error in Payments/[id]:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


