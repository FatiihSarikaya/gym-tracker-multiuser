import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import MemberPackage from '@/models/MemberPackage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  }
  const memberId = Number(req.query.memberId)
  if (Number.isNaN(memberId)) return res.status(400).json({ message: 'Invalid memberId' })
  const Member = (await import('@/models/Member')).default
  const m = await Member.findOne({ id: memberId }).lean()
  if (!m) return res.status(404).json({ message: 'Member not found' })
  const exists = await MemberPackage.findOne({ memberId: (m as any).id }).lean()
  if (exists) return res.json({ created: 0, reason: 'exists' })
  const total = Number((m as any).totalLessons || 0)
  const remaining = Number((m as any).remainingLessons || 0)
  if (total <= 0 && remaining <= 0) return res.json({ created: 0, reason: 'no-lessons' })
  const now = new Date().toISOString()
  await MemberPackage.create({
    id: await (await import('@/lib/sequence')).getNextId(MemberPackage as any),
    memberId: (m as any).id,
    membershipType: (m as any).membershipType || '',
    packageName: (m as any).membershipType || 'Paket',
    lessonCount: total || remaining,
    price: 0,
    purchasedAt: now,
    remainingLessons: remaining > 0 ? remaining : Math.max(total - ((m as any).attendedCount || 0), 0),
  })
  return res.json({ created: 1 })
}


