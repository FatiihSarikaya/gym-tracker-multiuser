import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import LessonAttendance from '@/models/LessonAttendance'
import { getNextId } from '@/lib/sequence'

async function getActivePackageForMember(memberId: number) {
  try {
    const MemberPackage = (await import('@/models/MemberPackage')).default
    const packages = await MemberPackage.find({ memberId }).sort({ id: 1 }).lean()
    for (const pkg of packages) {
      if (pkg.remainingLessons > 0) return pkg
    }
    return null
  } catch (e) {
    console.error('Error getting active package:', e)
    return null
  }
}

function isPackageFinished(member: any) {
  const totalLessons = member.totalLessons || 0
  const attendedCount = member.attendedCount || 0
  return totalLessons === attendedCount && totalLessons > 0
}

async function activateNextPackage(memberId: number) {
  try {
    const MemberPackage = (await import('@/models/MemberPackage')).default
    const packages = await MemberPackage.find({ memberId }).sort({ id: 1 }).lean()
    for (const pkg of packages) {
      if (!pkg.isActive) {
        await MemberPackage.updateOne({ id: pkg.id }, { isActive: true, remainingLessons: pkg.lessonCount })
        const Member = (await import('@/models/Member')).default
        const member = await Member.findOne({ id: memberId })
        if (member) {
          member.totalLessons = (member.totalLessons || 0) + pkg.lessonCount
          member.remainingLessons = (member.remainingLessons || 0) + pkg.lessonCount
          member.membershipType = pkg.packageName
          await member.save()
        }
        return pkg
      }
    }
    return null
  } catch (e) {
    console.error('Error activating next package:', e)
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect()

    if (req.method === 'GET') {
      const items = await LessonAttendance.find({}).lean()
      return res.status(200).json(items)
    }

  if (req.method === 'POST') {
    const payload = req.body || {}
    const now = new Date().toISOString()
    const existing = await LessonAttendance.findOne({ memberId: payload.memberId, lessonId: payload.lessonId, lessonDate: payload.lessonDate }).lean()
    if (existing) {
      const ex: any = existing as any
      return res.status(409).json({ message: 'Attendance already exists for this member, lesson and date', id: ex?.id })
    }
    const activePackage = await getActivePackageForMember(payload.memberId)
    const item = {
      id: await getNextId(LessonAttendance),
      memberId: payload.memberId,
      lessonId: payload.lessonId,
      lessonDate: payload.lessonDate,
      attended: payload.attended ?? false,
      type: payload.type || 'pakete-dahil',
      // @ts-ignore
      packageId: (activePackage as any)?.id || null,
      // @ts-ignore
      packageName: (activePackage as any)?.packageName || '',
      notes: payload.notes || '',
      createdAt: now
    }
    await LessonAttendance.create(item)
    try {
      const Member = (await import('@/models/Member')).default
      const MemberPackage = (await import('@/models/MemberPackage')).default
      const Attendance = (await import('@/models/Attendance')).default
      const member = await Member.findOne({ id: payload.memberId })
      if (member) {
        if (payload.attended) {
          if (payload.type === 'ekstra') {
            member.extraCount = (member.extraCount || 0) + 1
          } else {
            member.attendedCount = (member.attendedCount || 0) + 1
            member.remainingLessons = Math.max((member.totalLessons || 0) - (member.attendedCount || 0), 0)
            const latestPkg = await MemberPackage.findOne({ memberId: payload.memberId }).sort({ id: -1 })
            if (latestPkg && latestPkg.remainingLessons > 0) {
              latestPkg.remainingLessons -= 1
              await latestPkg.save()
            }
            if (isPackageFinished(member)) {
              await activateNextPackage(payload.memberId)
            }
          }
          const now2 = new Date().toISOString()
          await Attendance.create({
            id: await (await import('@/lib/sequence')).getNextId(Attendance as any),
            memberId: payload.memberId,
            checkInTime: now2,
            checkOutTime: null,
            notes: `lesson:${payload.lessonId} date:${payload.lessonDate}`,
            createdAt: now2,
          })
        } else {
          const latestPkg = await MemberPackage.findOne({ memberId: payload.memberId }).sort({ id: -1 })
          if (latestPkg && latestPkg.remainingLessons > 0) {
            latestPkg.remainingLessons -= 1
            await latestPkg.save()
          }
          member.remainingLessons = Math.max((member.remainingLessons || 0) - 1, 0)
        }
        await member.save()
      }
    } catch {}
    return res.status(201).json(item)
  }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Error in LessonAttendances/index:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


