import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Member from '@/models/Member'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect()

    const id = Number(req.query.id)
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' })

    if (req.method === 'GET') {
      const member = await Member.findOne({ id }).lean()
      if (!member) return res.status(404).json({ message: 'Member not found' })
      return res.status(200).json(member)
    }

  if (req.method === 'PUT') {
    try {
      const updated = await Member.findOneAndUpdate(
        { id },
        { ...req.body, updatedAt: new Date().toISOString() },
        { new: false, runValidators: true }
      )
      if (!updated) return res.status(404).json({ message: 'Member not found' })
      return res.status(204).end()
    } catch (err: any) {
      if (err && err.name === 'ValidationError') {
        const errors: Record<string, string> = {}
        for (const [k, v] of Object.entries(err.errors || {})) {
          // @ts-ignore
          errors[k] = (v as any)?.message || 'Geçersiz'
        }
        return res.status(400).json({ message: 'Validation error', errors })
      }
      console.error('PUT /Members/:id failed', err)
      return res.status(500).json({ message: 'Internal Server Error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const member = await Member.findOne({ id })
      if (!member) return res.status(404).json({ message: 'Member not found' })

      // Cascade deletions for related collections
      try {
        const MemberPackage = (await import('@/models/MemberPackage')).default
        await MemberPackage.deleteMany({ memberId: id })
      } catch (error) { console.error('Error deleting member packages:', error) }

      try {
        const LessonAttendance = (await import('@/models/LessonAttendance')).default
        await LessonAttendance.deleteMany({ memberId: id })
      } catch (error) { console.error('Error deleting lesson attendances:', error) }

      try {
        const MemberLesson = (await import('@/models/MemberLesson')).default
        await MemberLesson.deleteMany({ memberId: id })
      } catch (error) { console.error('Error deleting member lessons:', error) }

      try {
        const Payment = (await import('@/models/Payment')).default
        await Payment.deleteMany({ memberId: id })
      } catch (error) { console.error('Error deleting payments:', error) }

      try {
        const Attendance = (await import('@/models/Attendance')).default
        await Attendance.deleteMany({ memberId: id })
      } catch (error) { console.error('Error deleting attendance records:', error) }

      await Member.deleteOne({ id })
      return res.status(204).end()
    } catch (error) {
      console.error('Error deleting member:', error)
      return res.status(500).json({ message: 'Internal Server Error' })
    }
  }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Error in Members/[id]:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


