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
    console.log(`Creating member package for member ${member.id}:`, { packageName, initialLessons, membershipType: member.membershipType })
    
    if (initialLessons > 0) {
      const MemberPackage = (await import('../models/MemberPackage.js')).default
      // Check if package already exists for this member to avoid duplicates
      const existingPackage = await MemberPackage.findOne({ 
        memberId: member.id, 
        packageName: packageName 
      })
      
      console.log(`Existing package check for member ${member.id}, package ${packageName}:`, existingPackage)
      
      if (!existingPackage) {
        const packageData = {
          id: await getNextId(MemberPackage),
          memberId: member.id,
          membershipType: member.membershipType || '',
          packageName,
          lessonCount: initialLessons,
          price: Number(payload.price) || 0,
          purchasedAt: now,
          remainingLessons: initialLessons,
        }
        console.log(`Creating new package for member ${member.id}:`, packageData)
        await MemberPackage.create(packageData)
        console.log(`Package created successfully for member ${member.id}`)
      } else {
        console.log(`Package already exists for member ${member.id}, skipping creation`)
      }
    }
  } catch (error) {
    console.error('Error creating member package:', error)
  }

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
  try {
    const id = Number(req.params.id)
    
    // Check if member exists
    const member = await Member.findOne({ id })
    if (!member) return res.status(404).json({ message: 'Member not found' })
    
    console.log(`Deleting member ${id} and all related records...`)
    
    // Delete all related records
    const deletePromises = []
    
    // Delete MemberPackages
    try {
      const MemberPackage = (await import('../models/MemberPackage.js')).default
      const packageResult = await MemberPackage.deleteMany({ memberId: id })
      console.log(`Deleted ${packageResult.deletedCount} member packages`)
    } catch (error) {
      console.error('Error deleting member packages:', error)
    }
    
    // Delete LessonAttendances
    try {
      const LessonAttendance = (await import('../models/LessonAttendance.js')).default
      const attendanceResult = await LessonAttendance.deleteMany({ memberId: id })
      console.log(`Deleted ${attendanceResult.deletedCount} lesson attendances`)
    } catch (error) {
      console.error('Error deleting lesson attendances:', error)
    }
    
    // Delete MemberLessons
    try {
      const MemberLesson = (await import('../models/MemberLesson.js')).default
      const lessonResult = await MemberLesson.deleteMany({ memberId: id })
      console.log(`Deleted ${lessonResult.deletedCount} member lessons`)
    } catch (error) {
      console.error('Error deleting member lessons:', error)
    }
    
    // Delete Payments
    try {
      const Payment = (await import('../models/Payment.js')).default
      const paymentResult = await Payment.deleteMany({ memberId: id })
      console.log(`Deleted ${paymentResult.deletedCount} payments`)
    } catch (error) {
      console.error('Error deleting payments:', error)
    }
    
    // Delete Attendance records
    try {
      const Attendance = (await import('../models/Attendance.js')).default
      const attendanceResult = await Attendance.deleteMany({ memberId: id })
      console.log(`Deleted ${attendanceResult.deletedCount} attendance records`)
    } catch (error) {
      console.error('Error deleting attendance records:', error)
    }
    
    // Finally delete the member
    const result = await Member.deleteOne({ id })
    console.log(`Deleted member ${id}`)
    
    res.status(204).end()
  } catch (error) {
    console.error('Error deleting member:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

// POST /api/Members/cleanup-orphaned
// Clean up orphaned records (records without corresponding members)
router.post('/cleanup-orphaned', async (req, res) => {
  try {
    console.log('Starting cleanup of orphaned records...')
    
    // Get all existing member IDs
    const members = await Member.find({}).select('id').lean()
    const memberIds = members.map(m => m.id)
    console.log(`Found ${memberIds.length} existing members`)
    
    let totalCleaned = 0
    
    // Clean up orphaned MemberPackages
    try {
      const MemberPackage = (await import('../models/MemberPackage.js')).default
      const orphanedPackages = await MemberPackage.find({ memberId: { $nin: memberIds } })
      if (orphanedPackages.length > 0) {
        const result = await MemberPackage.deleteMany({ memberId: { $nin: memberIds } })
        console.log(`Cleaned up ${result.deletedCount} orphaned member packages`)
        totalCleaned += result.deletedCount
      }
    } catch (error) {
      console.error('Error cleaning up orphaned packages:', error)
    }
    
    // Clean up orphaned LessonAttendances
    try {
      const LessonAttendance = (await import('../models/LessonAttendance.js')).default
      const orphanedAttendances = await LessonAttendance.find({ memberId: { $nin: memberIds } })
      if (orphanedAttendances.length > 0) {
        const result = await LessonAttendance.deleteMany({ memberId: { $nin: memberIds } })
        console.log(`Cleaned up ${result.deletedCount} orphaned lesson attendances`)
        totalCleaned += result.deletedCount
      }
    } catch (error) {
      console.error('Error cleaning up orphaned attendances:', error)
    }
    
    // Clean up orphaned MemberLessons
    try {
      const MemberLesson = (await import('../models/MemberLesson.js')).default
      const orphanedLessons = await MemberLesson.find({ memberId: { $nin: memberIds } })
      if (orphanedLessons.length > 0) {
        const result = await MemberLesson.deleteMany({ memberId: { $nin: memberIds } })
        console.log(`Cleaned up ${result.deletedCount} orphaned member lessons`)
        totalCleaned += result.deletedCount
      }
    } catch (error) {
      console.error('Error cleaning up orphaned lessons:', error)
    }
    
    // Clean up orphaned Payments
    try {
      const Payment = (await import('../models/Payment.js')).default
      const orphanedPayments = await Payment.find({ memberId: { $nin: memberIds } })
      if (orphanedPayments.length > 0) {
        const result = await Payment.deleteMany({ memberId: { $nin: memberIds } })
        console.log(`Cleaned up ${result.deletedCount} orphaned payments`)
        totalCleaned += result.deletedCount
      }
    } catch (error) {
      console.error('Error cleaning up orphaned payments:', error)
    }
    
    // Clean up orphaned Attendance records
    try {
      const Attendance = (await import('../models/Attendance.js')).default
      const orphanedAttendance = await Attendance.find({ memberId: { $nin: memberIds } })
      if (orphanedAttendance.length > 0) {
        const result = await Attendance.deleteMany({ memberId: { $nin: memberIds } })
        console.log(`Cleaned up ${result.deletedCount} orphaned attendance records`)
        totalCleaned += result.deletedCount
      }
    } catch (error) {
      console.error('Error cleaning up orphaned attendance:', error)
    }
    
    console.log(`Cleanup completed. Total orphaned records removed: ${totalCleaned}`)
    res.json({ 
      cleaned: totalCleaned, 
      message: `Cleaned up ${totalCleaned} orphaned records` 
    })
  } catch (error) {
    console.error('Error during cleanup:', error)
    res.status(500).json({ error: 'Failed to clean up orphaned records' })
  }
})

export default router



