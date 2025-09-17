import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import MemberPackage from '@/models/MemberPackage'
import { requireAuth } from '@/lib/session'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireAuth(req, res)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await dbConnect()
    const memberId = Number(req.query.memberId)
    if (Number.isNaN(memberId)) return res.status(400).json({ message: 'Invalid memberId' })
    if (req.method === 'GET') {
      const items = await MemberPackage.find({ userId: user.id, memberId }).sort({ id: -1 }).lean()
      return res.status(200).json(items)
    }
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('MemberPackages member error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}


