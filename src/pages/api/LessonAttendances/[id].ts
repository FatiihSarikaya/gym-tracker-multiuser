import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import LessonAttendance from '@/models/LessonAttendance'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect()
    const id = Number(req.query.id)
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' })

    if (req.method === 'GET') {
      const item = await LessonAttendance.findOne({ id }).lean()
      if (!item) return res.status(404).json({ message: 'LessonAttendance not found' })
      return res.status(200).json(item)
    }

    if (req.method === 'PUT') {
      const prev = await LessonAttendance.findOneAndUpdate({ id }, { ...req.body }, { new: false })
      if (!prev) return res.status(404).json({ message: 'LessonAttendance not found' })
      return res.status(204).end()
    }

    if (req.method === 'DELETE') {
      const result = await LessonAttendance.deleteOne({ id })
      if (result.deletedCount === 0) return res.status(404).json({ message: 'LessonAttendance not found' })
      return res.status(204).end()
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Error in LessonAttendances/[id]:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


