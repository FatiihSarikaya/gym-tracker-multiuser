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
  const id = Number(req.query.id)
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' })

  if (req.method === 'DELETE') {
    const packageToDelete = await MemberPackage.findOne({ id })
    if (!packageToDelete) return res.status(404).json({ message: 'Package not found' })
    const wasActive = packageToDelete.isActive
    const memberId = packageToDelete.memberId
    try {
      const member = await Member.findOne({ id: memberId })
      if (member) {
        member.membershipType = 'Paketsiz'
        member.totalLessons = 0
        member.attendedCount = 0
        member.extraCount = 0
        member.remainingLessons = 0
        await member.save()
      }
    } catch {}
    await MemberPackage.deleteOne({ id })
    if (wasActive) {
      await activateNextPackage(memberId)
    }
    try {
      const remainingAfter = await MemberPackage.countDocuments({ memberId })
      if (remainingAfter === 0) {
        const member = await Member.findOne({ id: memberId })
        if (member) {
          member.membershipType = 'Paketsiz'
          member.totalLessons = 0
          member.attendedCount = 0
          member.extraCount = 0
          member.remainingLessons = 0
          await member.save()
        }
      }
    } catch {}
    return res.status(204).end()
  }

  res.setHeader('Allow', ['DELETE'])
  return res.status(405).json({ message: 'Method Not Allowed' })
}


