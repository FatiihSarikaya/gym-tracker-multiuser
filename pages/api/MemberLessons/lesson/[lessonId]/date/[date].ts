import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import MemberLesson from '@/models/MemberLesson'
import { requireAuth } from '@/lib/session'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireAuth(req, res)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await dbConnect()
    const lessonId = Number(req.query.lessonId)
    if (Number.isNaN(lessonId)) return res.status(400).json({ message: 'Invalid lessonId' })
    if (req.method === 'GET') {
      const list = await MemberLesson.find({ lessonId, userId: user.id }).lean()
      return res.status(200).json(list)
    }
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Error in MemberLessons/lesson/[lessonId]/date/[date]:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


