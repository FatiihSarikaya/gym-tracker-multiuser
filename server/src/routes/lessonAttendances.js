import { Router } from 'express'
import { nextId } from '../lib/db.js'
import LessonAttendance from '../models/LessonAttendance.js'
import { getNextId } from '../lib/sequence.js'

const router = Router()

// GET /api/LessonAttendances
router.get('/', async (req, res) => {
  const items = await LessonAttendance.find({}).lean()
  res.json(items)
})

// GET /api/LessonAttendances/member/:memberId
router.get('/member/:memberId', async (req, res) => {
  const memberId = Number(req.params.memberId)
  const list = await LessonAttendance.find({ memberId }).lean()
  res.json(list)
})

// GET /api/LessonAttendances/lesson/:lessonId
router.get('/lesson/:lessonId', async (req, res) => {
  const lessonId = Number(req.params.lessonId)
  const list = await LessonAttendance.find({ lessonId }).lean()
  res.json(list)
})

// GET /api/LessonAttendances/lesson/:lessonId/date/:lessonDate
router.get('/lesson/:lessonId/date/:lessonDate', async (req, res) => {
  const lessonId = Number(req.params.lessonId)
  const lessonDate = req.params.lessonDate
  const list = await LessonAttendance.find({ lessonId, lessonDate }).lean()
  res.json(list)
})

// GET /api/LessonAttendances/date/:lessonDate
router.get('/date/:lessonDate', async (req, res) => {
  const lessonDate = req.params.lessonDate
  const list = await LessonAttendance.find({ lessonDate }).lean()
  res.json(list)
})

// POST /api/LessonAttendances
router.post('/', async (req, res) => {
  const payload = req.body || {}
  const now = new Date().toISOString()
  // Prevent duplicate records for same member+lesson+date
  const existing = await LessonAttendance.findOne({
    memberId: payload.memberId,
    lessonId: payload.lessonId,
    lessonDate: payload.lessonDate,
  }).lean()
  if (existing) {
    return res.status(409).json({ message: 'Attendance already exists for this member, lesson and date', id: existing.id })
  }
  const item = {
    id: await getNextId(LessonAttendance),
    memberId: payload.memberId,
    lessonId: payload.lessonId,
    lessonDate: payload.lessonDate,
    attended: payload.attended ?? false,
    type: payload.type || 'pakete-dahil',
    notes: payload.notes || '',
    createdAt: now
  }
  await LessonAttendance.create(item)
  // Update member counters and latest package based on attendance
  try {
    const Member = (await import('../models/Member.js')).default
    const MemberPackage = (await import('../models/MemberPackage.js')).default
    const Attendance = (await import('../models/Attendance.js')).default
    const member = await Member.findOne({ id: payload.memberId })
    if (member && payload.attended) {
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
      }
      // Also create a generic Attendance record for history views
      const now = new Date().toISOString()
      await Attendance.create({
        id: await (await import('../lib/sequence.js')).getNextId(Attendance),
        memberId: payload.memberId,
        checkInTime: now,
        checkOutTime: null,
        notes: `lesson:${payload.lessonId} date:${payload.lessonDate}`,
        createdAt: now,
      })
      await member.save()
    }
  } catch {}
  res.status(201).json(item)
})

// GET /api/LessonAttendances/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const item = await LessonAttendance.findOne({ id }).lean()
  if (!item) return res.status(404).json({ message: 'LessonAttendance not found' })
  res.json(item)
})

// PUT /api/LessonAttendances/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const prev = await LessonAttendance.findOneAndUpdate(
    { id },
    { ...req.body },
    { new: false }
  )
  if (!prev) return res.status(404).json({ message: 'LessonAttendance not found' })
  // Adjust counters if needed based on diff
  try {
    const Member = (await import('../models/Member.js')).default
    const MemberPackage = (await import('../models/MemberPackage.js')).default
    const Attendance = (await import('../models/Attendance.js')).default
    const member = await Member.findOne({ id: prev.memberId })
    if (member) {
      const newAttended = req.body.attended ?? prev.attended
      const newType = req.body.type ?? prev.type
      // Revert previous effect
      if (prev.attended) {
        if (prev.type === 'ekstra') {
          member.extraCount = Math.max((member.extraCount || 0) - 1, 0)
        } else {
          member.attendedCount = Math.max((member.attendedCount || 0) - 1, 0)
          member.remainingLessons = Math.max((member.totalLessons || 0) - (member.attendedCount || 0), 0)
          const latestPkg = await MemberPackage.findOne({ memberId: prev.memberId }).sort({ id: -1 })
          if (latestPkg) {
            latestPkg.remainingLessons = (latestPkg.remainingLessons || 0) + 1
            await latestPkg.save()
          }
        }
      }
      // Apply new effect
      if (newAttended) {
        if (newType === 'ekstra') {
          member.extraCount = (member.extraCount || 0) + 1
        } else {
          member.attendedCount = (member.attendedCount || 0) + 1
          member.remainingLessons = Math.max((member.totalLessons || 0) - (member.attendedCount || 0), 0)
          const latestPkg = await MemberPackage.findOne({ memberId: prev.memberId }).sort({ id: -1 })
          if (latestPkg && latestPkg.remainingLessons > 0) {
            latestPkg.remainingLessons -= 1
            await latestPkg.save()
          }
        }
        // Create an Attendance record if marking attended now
        const now = new Date().toISOString()
        await Attendance.create({
          id: await (await import('../lib/sequence.js')).getNextId(Attendance),
          memberId: prev.memberId,
          checkInTime: now,
          checkOutTime: null,
          notes: `lesson:${prev.lessonId} date:${prev.lessonDate}`,
          createdAt: now,
        })
      }
      await member.save()
    }
  } catch {}
  res.status(204).end()
})

// DELETE /api/LessonAttendances/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const result = await LessonAttendance.deleteOne({ id })
  if (result.deletedCount === 0) return res.status(404).json({ message: 'LessonAttendance not found' })
  res.status(204).end()
})

export default router


