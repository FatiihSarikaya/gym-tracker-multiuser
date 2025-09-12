import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import MemberPackage from '@/models/MemberPackage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  const memberId = Number(req.query.memberId)
  if (Number.isNaN(memberId)) return res.status(400).json({ message: 'Invalid memberId' })
  if (req.method === 'GET') {
    const items = await MemberPackage.find({ memberId }).sort({ id: -1 }).lean()
    return res.status(200).json(items)
  }
  res.setHeader('Allow', ['GET'])
  return res.status(405).json({ message: 'Method Not Allowed' })
}


