import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Attendance from '@/models/Attendance'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect()
    const id = Number(req.query.id)
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' })

    if (req.method === 'GET') {
      const item = await Attendance.findOne({ id }).lean()
      if (!item) return res.status(404).json({ message: 'Attendance not found' })
      return res.status(200).json(item)
    }

    if (req.method === 'DELETE') {
      const result = await Attendance.deleteOne({ id })
      if (result.deletedCount === 0) return res.status(404).json({ message: 'Attendance not found' })
      return res.status(204).end()
    }

    res.setHeader('Allow', ['GET', 'DELETE'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Error in Attendance/[id]:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


