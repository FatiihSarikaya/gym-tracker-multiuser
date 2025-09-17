import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Lesson from '@/models/Lesson'
import { getNextId } from '@/lib/sequence'
import { requireAuth } from '@/lib/session'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireAuth(req, res)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await dbConnect()

    if (req.method === 'GET') {
      const items = await Lesson.find({ userId: user.id }).lean()
      return res.status(200).json(items)
    }

    if (req.method === 'POST') {
      const payload = req.body || {}
      const now = new Date().toISOString()
      const lesson = {
        id: await getNextId(Lesson),
        userId: user.id,
        name: payload.name,
        description: payload.description || '',
        instructor: payload.instructor,
        dayOfWeek: payload.dayOfWeek,
        startTime: payload.startTime,
        endTime: payload.endTime,
        maxCapacity: payload.maxCapacity,
        location: payload.location,
        lessonDate: payload.lessonDate,
        isActive: payload.isActive ?? true,
        createdAt: now,
        updatedAt: now
      }
      await Lesson.create(lesson)
      return res.status(201).json(lesson)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Error in Lessons/index:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


