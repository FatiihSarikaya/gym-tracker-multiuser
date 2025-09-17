import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import MemberLesson from '@/models/MemberLesson'
import { getNextId } from '@/lib/sequence'
import { requireAuth } from '@/lib/session'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireAuth(req, res)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await dbConnect()

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({ message: 'Method Not Allowed' })
    }

    const { memberId, lessonId, daysOfWeek = [], startDate, endDate = null } = req.body || {}
    
    if (!memberId || !lessonId || !startDate) {
      return res.status(400).json({ message: 'memberId, lessonId, and startDate are required' })
    }

    // Check if assignment already exists
    const existingAssignment = await MemberLesson.findOne({ 
      memberId: Number(memberId), 
      lessonId: Number(lessonId),
      userId: user.id 
    }).lean()
    
    if (existingAssignment) {
      return res.status(409).json({ message: 'Member is already assigned to this lesson' })
    }

    // Create new assignment
    const doc = {
      id: await getNextId(MemberLesson),
      userId: user.id,
      memberId: Number(memberId),
      lessonId: Number(lessonId),
      daysOfWeek,
      startDate,
      endDate
    }

    await MemberLesson.create(doc)
    
    return res.status(201).json(doc)
  } catch (error) {
    console.error('Error in MemberLessons/assign:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
