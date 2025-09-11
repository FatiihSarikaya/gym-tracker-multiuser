import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import MemberLesson from '@/models/MemberLesson'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  const id = Number(req.query.id)
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' })
  if (req.method === 'DELETE') {
    const result = await MemberLesson.deleteOne({ id })
    if (result.deletedCount === 0) return res.status(404).json({ message: 'MemberLesson not found' })
    return res.status(204).end()
  }
  res.setHeader('Allow', ['DELETE'])
  return res.status(405).json({ message: 'Method Not Allowed' })
}


