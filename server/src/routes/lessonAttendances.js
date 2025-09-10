import { Router } from 'express'
import { nextId } from '../lib/db.js'
import LessonAttendance from '../models/LessonAttendance.js'
import { getNextId } from '../lib/sequence.js'

const router = Router()

// Helper function to determine which package to use for attendance
const getActivePackageForMember = async (memberId) => {
  try {
    const MemberPackage = (await import('../models/MemberPackage.js')).default
    const packages = await MemberPackage.find({ memberId }).sort({ id: 1 }).lean() // Eski paketlerden başla
    
    // Find the first package with remaining lessons (FIFO - First In, First Out)
    for (const pkg of packages) {
      if (pkg.remainingLessons > 0) {
        return pkg
      }
    }
    
    // If no package has remaining lessons, return null (no active package)
    return null
  } catch (error) {
    console.error('Error getting active package:', error)
    return null
  }
}

// Helper function to check if member's package is finished
const isPackageFinished = (member) => {
  const totalLessons = member.totalLessons || 0
  const attendedCount = member.attendedCount || 0
  return totalLessons === attendedCount && totalLessons > 0
}

// Helper function to activate next package when current one is finished
const activateNextPackage = async (memberId) => {
  try {
    const MemberPackage = (await import('../models/MemberPackage.js')).default
    const packages = await MemberPackage.find({ memberId }).sort({ id: 1 }).lean()
    
    // Find the first inactive package (waiting package)
    for (const pkg of packages) {
      if (!pkg.isActive) {
        // Activate this package and reset remainingLessons to full
        await MemberPackage.updateOne(
          { id: pkg.id },
          { isActive: true, remainingLessons: pkg.lessonCount }
        )
        
        // Update member totals and membership type
        const Member = (await import('../models/Member.js')).default
        const member = await Member.findOne({ id: memberId })
        if (member) {
          member.totalLessons = (member.totalLessons || 0) + pkg.lessonCount
          member.remainingLessons = (member.remainingLessons || 0) + pkg.lessonCount
          member.membershipType = pkg.packageName // Update membership type to new package
          await member.save()
        }
        
        console.log(`Activated next package ${pkg.packageName} for member ${memberId}`)
        return pkg
      }
    }
    
    return null
  } catch (error) {
    console.error('Error activating next package:', error)
    return null
  }
}

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
  // Get active package for this member
  const activePackage = await getActivePackageForMember(payload.memberId)
  
  const item = {
    id: await getNextId(LessonAttendance),
    memberId: payload.memberId,
    lessonId: payload.lessonId,
    lessonDate: payload.lessonDate,
    attended: payload.attended ?? false,
    type: payload.type || 'pakete-dahil',
    packageId: activePackage?.id || null,
    packageName: activePackage?.packageName || '',
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
    if (member) {
      if (payload.attended) {
        // Present or Extra - increment counters and deduct lesson
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
          
          // Check if package is finished based on total lessons = attended count
          if (isPackageFinished(member)) {
            // Try to activate next package
            const nextPackage = await activateNextPackage(payload.memberId)
            if (!nextPackage) {
              console.log(`No more packages available for member ${payload.memberId}`)
            }
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
      } else {
        // Absent - also deduct lesson count but don't increment attended count
        const latestPkg = await MemberPackage.findOne({ memberId: payload.memberId }).sort({ id: -1 })
        if (latestPkg && latestPkg.remainingLessons > 0) {
          latestPkg.remainingLessons -= 1
          await latestPkg.save()
        }
        // Update member's remaining lessons count
        member.remainingLessons = Math.max((member.remainingLessons || 0) - 1, 0)
      }
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
  
  // Get active package for this member
  const activePackage = await getActivePackageForMember(req.body.memberId || prev?.memberId)
  
  const prev = await LessonAttendance.findOneAndUpdate(
    { id },
    { 
      ...req.body,
      packageId: activePackage?.id || null,
      packageName: activePackage?.packageName || ''
    },
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
        // Was present/extra - revert counters and add back lesson
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
      } else {
        // Was absent - add back lesson count
        const latestPkg = await MemberPackage.findOne({ memberId: prev.memberId }).sort({ id: -1 })
        if (latestPkg) {
          latestPkg.remainingLessons = (latestPkg.remainingLessons || 0) + 1
          await latestPkg.save()
        }
        member.remainingLessons = (member.remainingLessons || 0) + 1
      }
      
      // Apply new effect
      if (newAttended) {
        // Present or Extra - increment counters and deduct lesson
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
      } else {
        // Absent - also deduct lesson count but don't increment attended count
        const latestPkg = await MemberPackage.findOne({ memberId: prev.memberId }).sort({ id: -1 })
        if (latestPkg && latestPkg.remainingLessons > 0) {
          latestPkg.remainingLessons -= 1
          await latestPkg.save()
        }
        // Update member's remaining lessons count
        member.remainingLessons = Math.max((member.remainingLessons || 0) - 1, 0)
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


