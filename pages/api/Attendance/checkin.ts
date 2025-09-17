import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Attendance from '@/models/Attendance'
import MemberPackage from '@/models/MemberPackage'
import { getNextId } from '@/lib/sequence'
import { requireAuth } from '@/lib/session'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireAuth(req, res)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await dbConnect()
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({ message: 'Method Not Allowed' })
    }
    const { memberId, notes } = req.body || {}
    const now = new Date().toISOString()
    const record = {
      id: await getNextId(Attendance),
      userId: user.id,
      memberId,
      checkInTime: now,
      checkOutTime: null,
      notes: notes || '',
      createdAt: now
    }
    await Attendance.create(record)

    const latestPkg = await MemberPackage.findOne({ userId: user.id, memberId }).sort({ id: -1 })
    if (latestPkg && latestPkg.remainingLessons > 0) {
      latestPkg.remainingLessons -= 1
      await latestPkg.save()
    }
    try {
      const Member = (await import('@/models/Member')).default
      const member = await Member.findOne({ userId: user.id, id: memberId })
      if (member) {
        member.attendedCount = (member.attendedCount || 0) + 1
        member.remainingLessons = Math.max((member.totalLessons || 0) - (member.attendedCount || 0), 0)
        await member.save()
      }
    } catch {}
    return res.status(201).json(record)
  } catch (error) {
    console.error('Checkin error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}


