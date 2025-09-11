import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import LessonAttendance from '@/models/LessonAttendance'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  const lessonId = Number(req.query.lessonId)
  if (Number.isNaN(lessonId)) return res.status(400).json({ message: 'Invalid lessonId' })
  if (req.method === 'GET') {
    const list = await LessonAttendance.find({ lessonId }).lean()
    return res.status(200).json(list)
  }
  res.setHeader('Allow', ['GET'])
  return res.status(405).json({ message: 'Method Not Allowed' })
}


