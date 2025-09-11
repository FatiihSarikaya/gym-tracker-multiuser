import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Lesson from '@/models/Lesson'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  }
  const targetDate = String(req.query.date)
  const items = await Lesson.find({ lessonDate: targetDate, isActive: true }).lean()
  return res.status(200).json(items)
}


