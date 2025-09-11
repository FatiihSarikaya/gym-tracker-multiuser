import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Lesson from '@/models/Lesson'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  const id = Number(req.query.id)
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' })

  if (req.method === 'GET') {
    const item = await Lesson.findOne({ id }).lean()
    if (!item) return res.status(404).json({ message: 'Lesson not found' })
    return res.status(200).json(item)
  }

  if (req.method === 'PUT') {
    const updated = await Lesson.findOneAndUpdate(
      { id },
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: false }
    )
    if (!updated) return res.status(404).json({ message: 'Lesson not found' })
    return res.status(204).end()
  }

  if (req.method === 'DELETE') {
    const result = await Lesson.deleteOne({ id })
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Lesson not found' })
    return res.status(204).end()
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ message: 'Method Not Allowed' })
}


