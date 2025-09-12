import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../lib/db'
import MemberPackage from '../../models/MemberPackage'
import Package from '../../models/Package'
import { getNextId } from '../../lib/sequence'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  }
  const { memberId, packageName } = req.body || {}
  if (!memberId || !packageName) return res.status(400).json({ message: 'memberId and packageName are required' })
  const pack = await Package.findOne({ name: packageName }).lean()
  if (!pack) return res.status(404).json({ message: 'Package not found' })
  const p: any = pack as any
  const now = new Date().toISOString()
  const Member = (await import('../../models/Member')).default
  const member = await Member.findOne({ id: Number(memberId) })
  if (!member) return res.status(404).json({ message: 'Member not found' })

  const existingPackages = await MemberPackage.find({ memberId: Number(memberId) }).lean()
  if (existingPackages.length > 0) {
    return res.status(409).json({ message: 'Üyenin zaten bir paketi var. Yeni paket eklemek için önce mevcut paketi silin.' })
  }

  const doc = {
    id: await getNextId(MemberPackage),
    memberId: Number(memberId),
    membershipType: member.membershipType || '',
    packageName: p.name,
    lessonCount: p.lessonCount,
    price: p.price,
    purchasedAt: now,
    remainingLessons: p.lessonCount,
    isActive: true
  }
  await MemberPackage.create(doc)

  member.membershipType = p.name
  member.membershipStartDate = now.split('T')[0]
  member.totalLessons = p.lessonCount || 0
  member.attendedCount = 0
  member.extraCount = 0
  member.remainingLessons = p.lessonCount || 0
  await member.save()

  return res.status(201).json(doc)
}


