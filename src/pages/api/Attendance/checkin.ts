import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Attendance from '@/models/Attendance'
import MemberPackage from '@/models/MemberPackage'
import { getNextId } from '@/lib/sequence'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  }
  const { memberId, notes } = req.body || {}
  const now = new Date().toISOString()
  const record = {
    id: await getNextId(Attendance),
    memberId,
    checkInTime: now,
    checkOutTime: null,
    notes: notes || '',
    createdAt: now
  }
  await Attendance.create(record)

  const latestPkg = await MemberPackage.findOne({ memberId }).sort({ id: -1 })
  if (latestPkg && latestPkg.remainingLessons > 0) {
    latestPkg.remainingLessons -= 1
    await latestPkg.save()
  }
  try {
    const Member = (await import('@/models/Member')).default
    const member = await Member.findOne({ id: memberId })
    if (member) {
      member.attendedCount = (member.attendedCount || 0) + 1
      member.remainingLessons = Math.max((member.totalLessons || 0) - (member.attendedCount || 0), 0)
      await member.save()
    }
  } catch {}
  return res.status(201).json(record)
}


