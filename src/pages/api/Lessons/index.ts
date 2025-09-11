import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Lesson from '@/models/Lesson'
import { getNextId } from '@/lib/sequence'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  if (req.method === 'GET') {
    const items = await Lesson.find({}).lean()
    return res.status(200).json(items)
  }

  if (req.method === 'POST') {
    const payload = req.body || {}
    const now = new Date().toISOString()
    const lesson = {
      id: await getNextId(Lesson),
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
}


