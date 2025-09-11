import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import MemberPackage from '@/models/MemberPackage'
import Member from '@/models/Member'

async function activateNextPackage(memberId: number) {
  const packages = await MemberPackage.find({ memberId }).sort({ id: 1 }).lean()
  for (const pkg of packages) {
    if (!pkg.isActive) {
      await MemberPackage.updateOne({ id: pkg.id }, { isActive: true, remainingLessons: pkg.lessonCount })
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
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  }
  const memberId = Number(req.query.memberId)
  if (Number.isNaN(memberId)) return res.status(400).json({ message: 'Invalid memberId' })
  const member = await Member.findOne({ id: memberId }).lean()
  if (!member) return res.status(404).json({ message: 'Member not found' })
  const m: any = member as any
  const totalLessons = m.totalLessons || 0
  const attendedCount = m.attendedCount || 0
  const isPackageFinished = totalLessons === attendedCount && totalLessons > 0
  if (!isPackageFinished) return res.status(400).json({ message: 'Member still has remaining lessons' })
  const activatedPackage = await activateNextPackage(memberId)
  if (activatedPackage) {
    return res.json({ message: 'Waiting package activated successfully', package: activatedPackage })
  } else {
    return res.status(404).json({ message: 'No waiting package found' })
  }
}


