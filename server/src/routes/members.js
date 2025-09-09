import { Router } from 'express'
import { nextId } from '../lib/db.js'
import Member from '../models/Member.js'
import { getNextId } from '../lib/sequence.js'

const router = Router()

// GET /api/Members
router.get('/', async (req, res) => {
  const members = await Member.find({}).lean()
  res.json(members)
})

// GET /api/Members/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const member = await Member.findOne({ id }).lean()
  if (!member) return res.status(404).json({ message: 'Member not found' })
  res.json(member)
})

// POST /api/Members
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {}
    const now = new Date().toISOString()
    if (!payload.email || String(payload.email).trim() === '') {
      return res.status(400).json({ message: 'Validation error', errors: { email: 'Email boş bırakılamaz' } })
    }
    const member = {
      id: await getNextId(Member),
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phoneNumber: payload.phoneNumber || '',
      photoUrl: payload.photoUrl || '',
      dateOfBirth: payload.dateOfBirth,
      membershipStartDate: now,
      membershipEndDate: payload.membershipEndDate || null,
      membershipType: payload.membershipType,
      totalLessons: Number(payload.totalLessons) || 0,
      attendedCount: 0,
      extraCount: 0,
      remainingLessons: Number(payload.totalLessons) || 0,
      isActive: payload.isActive ?? true,
      createdAt: now,
      updatedAt: now
    }
    await Member.create(member)

  // Auto-create a MemberPackage if an initial lesson balance/package is provided
  try {
    const initialLessons = Number(payload.totalLessons) || 0
    const packageName = payload.packageName || payload.membershipType || 'Paket'
    if (initialLessons > 0) {
      const MemberPackage = (await import('../models/MemberPackage.js')).default
      await MemberPackage.create({
        id: await getNextId(MemberPackage),
        memberId: member.id,
        membershipType: member.membershipType || '',
        packageName,
        lessonCount: initialLessons,
        price: Number(payload.price) || 0,
        purchasedAt: now,
        remainingLessons: initialLessons,
      })
    }
  } catch {}

    res.status(201).json(member)
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      const errors = {}
      for (const [k, v] of Object.entries(err.errors || {})) {
        errors[k] = v?.message || 'Geçersiz'
      }
      return res.status(400).json({ message: 'Validation error', errors })
    }
    console.error('POST /Members failed', err)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
})

// PUT /api/Members/:id
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const updated = await Member.findOneAndUpdate(
      { id },
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: false, runValidators: true }
    )
    if (!updated) return res.status(404).json({ message: 'Member not found' })
    res.status(204).end()
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      const errors = {}
      for (const [k, v] of Object.entries(err.errors || {})) {
        errors[k] = v?.message || 'Geçersiz'
      }
      return res.status(400).json({ message: 'Validation error', errors })
    }
    console.error('PUT /Members failed', err)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
})

// DELETE /api/Members/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const result = await Member.deleteOne({ id })
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Member not found' })
  res.status(204).end()
})

export default router



