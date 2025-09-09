import { Router } from 'express'
import MemberPackage from '../models/MemberPackage.js'
import Package from '../models/Package.js'
import { getNextId } from '../lib/sequence.js'
import Member from '../models/Member.js'

const router = Router()

// GET /api/MemberPackages/member/:memberId
router.get('/member/:memberId', async (req, res) => {
  const memberId = Number(req.params.memberId)
  const items = await MemberPackage.find({ memberId }).sort({ id: -1 }).lean()
  res.json(items)
})

// POST /api/MemberPackages/purchase
router.post('/purchase', async (req, res) => {
  const { memberId, packageName } = req.body || {}
  if (!memberId || !packageName) return res.status(400).json({ message: 'memberId and packageName are required' })
  const pack = await Package.findOne({ name: packageName }).lean()
  if (!pack) return res.status(404).json({ message: 'Package not found' })
  const now = new Date().toISOString()
  // get membershipType from member
  const Member = (await import('../models/Member.js')).default
  const member = await Member.findOne({ id: Number(memberId) }).lean()
  const doc = {
    id: await getNextId(MemberPackage),
    memberId: Number(memberId),
    membershipType: member?.membershipType || '',
    packageName: pack.name,
    lessonCount: pack.lessonCount,
    price: pack.price,
    purchasedAt: now,
    remainingLessons: pack.lessonCount
  }
  await MemberPackage.create(doc)
  // Also reflect on member totals so UI shows updated package lessons
  try {
    const Member = (await import('../models/Member.js')).default
    const member = await Member.findOne({ id: Number(memberId) })
    if (member) {
      member.totalLessons = (member.totalLessons || 0) + (pack.lessonCount || 0)
      member.remainingLessons = Math.max((member.totalLessons || 0) - (member.attendedCount || 0), 0)
      await member.save()
    }
  } catch {}
  res.status(201).json(doc)
})

// POST /api/MemberPackages/backfill
// Create a synthetic package record for members who have totalLessons > 0
// but no entries in memberPackages yet. Useful to align historic data.
router.post('/backfill', async (req, res) => {
  const members = await Member.find({}).lean()
  let created = 0
  for (const m of members) {
    const exists = await MemberPackage.findOne({ memberId: m.id }).lean()
    const total = Number(m.totalLessons || 0)
    const remaining = Number(m.remainingLessons || 0)
    if (!exists && (total > 0 || remaining > 0)) {
      const now = new Date().toISOString()
      await MemberPackage.create({
        id: await getNextId(MemberPackage),
        memberId: m.id,
        membershipType: m.membershipType || '',
        packageName: m.membershipType || 'Paket',
        lessonCount: total || remaining,
        price: 0,
        purchasedAt: now,
        remainingLessons: remaining > 0 ? remaining : Math.max(total - (m.attendedCount || 0), 0),
      })
      created += 1
    }
  }
  res.json({ created })
})

// POST /api/MemberPackages/backfill/:memberId
router.post('/backfill/:memberId', async (req, res) => {
  const memberId = Number(req.params.memberId)
  const m = await Member.findOne({ id: memberId }).lean()
  if (!m) return res.status(404).json({ message: 'Member not found' })
  const exists = await MemberPackage.findOne({ memberId: m.id }).lean()
  if (exists) return res.json({ created: 0, reason: 'exists' })
  const total = Number(m.totalLessons || 0)
  const remaining = Number(m.remainingLessons || 0)
  if (total <= 0 && remaining <= 0) return res.json({ created: 0, reason: 'no-lessons' })
  const now = new Date().toISOString()
  await MemberPackage.create({
    id: await getNextId(MemberPackage),
    memberId: m.id,
    membershipType: m.membershipType || '',
    packageName: m.membershipType || 'Paket',
    lessonCount: total || remaining,
    price: 0,
    purchasedAt: now,
    remainingLessons: remaining > 0 ? remaining : Math.max(total - (m.attendedCount || 0), 0),
  })
  return res.json({ created: 1 })
})

export default router


