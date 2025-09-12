import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Attendance from '@/models/Attendance'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  }
  const id = Number(req.query.id)
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' })
  const updated = await Attendance.findOneAndUpdate(
    { id },
    { checkOutTime: new Date().toISOString() },
    { new: false }
  )
  if (!updated) return res.status(404).json({ message: 'Attendance not found' })
  return res.status(204).end()
}


