import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import LessonAttendance from '@/models/LessonAttendance'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect()
    const lessonDate = String(req.query.lessonDate)
    
    if (req.method === 'GET') {
      const list = await LessonAttendance.find({ lessonDate }).lean()
      return res.status(200).json(list)
    }
    
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Error in LessonAttendances/date/[lessonDate]:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


