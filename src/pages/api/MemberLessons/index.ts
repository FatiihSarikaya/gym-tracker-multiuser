import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import MemberLesson from '@/models/MemberLesson'
import Lesson from '@/models/Lesson'
import { getNextId } from '@/lib/sequence'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  if (req.method === 'GET') {
    const items = await MemberLesson.find({}).lean()
    return res.status(200).json(items)
  }

  if (req.method === 'POST') {
    const { memberId, lessonId, daysOfWeek = [], startDate, endDate = null } = req.body || {}
    if (!memberId || !lessonId || !startDate) return res.status(400).json({ message: 'memberId, lessonId, startDate required' })
    const lesson = await Lesson.findOne({ id: Number(lessonId) }).lean()
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' })
    const Member = (await import('@/models/Member')).default
    const member = await Member.findOne({ id: Number(memberId) }).lean()
    if (!member) return res.status(404).json({ message: 'Member not found' })

    const m: any = member as any
    const totalLessons = m.totalLessons || 0
    const attendedCount = m.attendedCount || 0
    const isPackageFinished = totalLessons === attendedCount && totalLessons > 0
    if (isPackageFinished) {
      const MemberPackage = (await import('@/models/MemberPackage')).default
      const waitingPackage = await MemberPackage.findOne({ memberId: Number(memberId), isActive: false }).sort({ id: 1 }).lean()
      if (waitingPackage) {
        const wp: any = waitingPackage as any
        await MemberPackage.updateOne({ id: wp.id }, { isActive: true, remainingLessons: wp.lessonCount })
        const updatedMember = await Member.findOne({ id: Number(memberId) })
        if (updatedMember) {
          updatedMember.totalLessons = (updatedMember.totalLessons || 0) + wp.lessonCount
          updatedMember.remainingLessons = (updatedMember.remainingLessons || 0) + wp.lessonCount
          updatedMember.membershipType = wp.packageName
          await updatedMember.save()
        }
      } else {
        return res.status(400).json({ message: 'Member has no remaining lesson credits and no waiting packages' })
      }
    }

    const existingAssignment = await MemberLesson.findOne({ memberId: Number(memberId), lessonId: Number(lessonId) }).lean()
    if (existingAssignment) {
      return res.status(409).json({ message: 'Member is already assigned to this lesson' })
    }

    const doc = {
      id: await getNextId(MemberLesson),
      memberId: Number(memberId),
      lessonId: Number(lessonId),
      daysOfWeek,
      startDate,
      endDate
    }
    await MemberLesson.create(doc)
    return res.status(201).json(doc)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ message: 'Method Not Allowed' })
}


