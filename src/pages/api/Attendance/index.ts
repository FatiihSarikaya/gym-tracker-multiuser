import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Attendance from '@/models/Attendance'
import MemberPackage from '@/models/MemberPackage'
import { getNextId } from '@/lib/sequence'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  if (req.method === 'GET') {
    const items = await Attendance.find({}).lean()
    return res.status(200).json(items)
  }

  if (req.method === 'POST') {
    // Not used for checkin; kept for completeness
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).json({ message: 'Method Not Allowed' })
}


