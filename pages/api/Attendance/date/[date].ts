import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Attendance from '@/models/Attendance'
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

    const date = String(req.query.date)
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' })
    }

    const attendances = await Attendance.find({ 
      userId: user.id,
      checkInTime: { $regex: `^${date}` }
    }).lean()

    return res.status(200).json(attendances)
  } catch (error) {
    console.error('Error in Attendance/date/[date]:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
