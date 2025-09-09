import { Router } from 'express'
import { nextId } from '../lib/db.js'
import Attendance from '../models/Attendance.js'
import MemberPackage from '../models/MemberPackage.js'
import { getNextId } from '../lib/sequence.js'

const router = Router()

// GET /api/Attendance
router.get('/', async (req, res) => {
  const items = await Attendance.find({}).lean()
  res.json(items)
})

// GET /api/Attendance/member/:memberId
router.get('/member/:memberId', async (req, res) => {
  const memberId = Number(req.params.memberId)
  const list = await Attendance.find({ memberId }).lean()
  res.json(list)
})

// POST /api/Attendance/checkin
router.post('/checkin', async (req, res) => {
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

  // decrement remaining lessons from latest active member package
  const latestPkg = await MemberPackage.findOne({ memberId }).sort({ id: -1 })
  if (latestPkg && latestPkg.remainingLessons > 0) {
    latestPkg.remainingLessons -= 1
    await latestPkg.save()
  }
  // also update member counters if present
  try {
    const member = await (await import('../models/Member.js')).default.findOne({ id: memberId })
    if (member) {
      member.attendedCount = (member.attendedCount || 0) + 1
      member.remainingLessons = Math.max((member.totalLessons || 0) - (member.attendedCount || 0), 0)
      await member.save()
    }
  } catch {}
  res.status(201).json(record)
})

// PUT /api/Attendance/:id/checkout
router.put('/:id/checkout', async (req, res) => {
  const id = Number(req.params.id)
  const updated = await Attendance.findOneAndUpdate(
    { id },
    { checkOutTime: new Date().toISOString() },
    { new: false }
  )
  if (!updated) return res.status(404).json({ message: 'Attendance not found' })
  res.status(204).end()
})

// GET /api/Attendance/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const item = await Attendance.findOne({ id }).lean()
  if (!item) return res.status(404).json({ message: 'Attendance not found' })
  res.json(item)
})

// DELETE /api/Attendance/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const result = await Attendance.deleteOne({ id })
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Attendance not found' })
  res.status(204).end()
})

export default router


