import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Lesson from '@/models/Lesson'
import { requireAuth } from '@/lib/session'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireAuth(req, res)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await dbConnect()
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ message: 'Method Not Allowed' })
    }
    const targetDate = String(req.query.date)
    const items = await Lesson.find({ lessonDate: targetDate, isActive: true, userId: user.id }).lean()
    return res.status(200).json(items)
  } catch (error) {
    console.error('Error in Lessons/date/[date]:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


