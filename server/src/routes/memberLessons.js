import { Router } from 'express'
import MemberLesson from '../models/MemberLesson.js'
import Lesson from '../models/Lesson.js'
import { getNextId } from '../lib/sequence.js'

const router = Router()

// GET /api/MemberLessons
router.get('/', async (req, res) => {
  const items = await MemberLesson.find({}).lean()
  res.json(items)
})

// POST /api/MemberLessons/assign
router.post('/assign', async (req, res) => {
  const { memberId, lessonId, daysOfWeek = [], startDate, endDate = null } = req.body || {}
  if (!memberId || !lessonId || !startDate) return res.status(400).json({ message: 'memberId, lessonId, startDate required' })
  
  // Check if lesson exists
  const lesson = await Lesson.findOne({ id: Number(lessonId) }).lean()
  if (!lesson) return res.status(404).json({ message: 'Lesson not found' })
  
  // Check if member exists and has remaining lessons
  const Member = (await import('../models/Member.js')).default
  const member = await Member.findOne({ id: Number(memberId) }).lean()
  if (!member) return res.status(404).json({ message: 'Member not found' })
  
  // Check if member's package is finished
  const totalLessons = member.totalLessons || 0
  const attendedCount = member.attendedCount || 0
  const isPackageFinished = totalLessons === attendedCount && totalLessons > 0
  
  if (isPackageFinished) {
    // Check if there's a waiting package to activate (regardless of remainingLessons)
    const MemberPackage = (await import('../models/MemberPackage.js')).default
    const waitingPackage = await MemberPackage.findOne({ 
      memberId: Number(memberId), 
      isActive: false
    }).sort({ id: 1 }).lean()
    
    if (waitingPackage) {
      // Activate the waiting package and reset remainingLessons to full
      await MemberPackage.updateOne(
        { id: waitingPackage.id },
        { isActive: true, remainingLessons: waitingPackage.lessonCount }
      )
      
      // Update member totals and membership type
      const updatedMember = await Member.findOne({ id: Number(memberId) })
      if (updatedMember) {
        updatedMember.totalLessons = (updatedMember.totalLessons || 0) + waitingPackage.lessonCount
        updatedMember.remainingLessons = (updatedMember.remainingLessons || 0) + waitingPackage.lessonCount
        updatedMember.membershipType = waitingPackage.packageName // Update membership type to new package
        await updatedMember.save()
        
        console.log(`Activated waiting package ${waitingPackage.packageName} for member ${memberId}`)
      }
    } else {
      return res.status(400).json({ message: 'Member has no remaining lesson credits and no waiting packages' })
    }
  }
  
  // Check if member is already assigned to this lesson
  const existingAssignment = await MemberLesson.findOne({ 
    memberId: Number(memberId), 
    lessonId: Number(lessonId) 
  }).lean()
  
  if (existingAssignment) {
    return res.status(409).json({ message: 'Member is already assigned to this lesson' })
  }
  
  const doc = {
    id: await getNextId(MemberLesson),
    memberId: Number(memberId),
    lessonId: Number(lessonId),
    daysOfWeek,
    startDate,
    endDate
  }
  await MemberLesson.create(doc)
  res.status(201).json(doc)
})

// GET /api/MemberLessons/lesson/:lessonId/date/:dateISO (YYYY-MM-DD)
router.get('/lesson/:lessonId/date/:date', async (req, res) => {
  const lessonId = Number(req.params.lessonId)
  
  // Validate lessonId
  if (isNaN(lessonId)) {
    return res.status(400).json({ message: 'Invalid lessonId parameter' })
  }
  
  const list = await MemberLesson.find({ lessonId }).lean()
  res.json(list)
})

// GET /api/MemberLessons/member/:memberId
router.get('/member/:memberId', async (req, res) => {
  const memberId = Number(req.params.memberId)
  const items = await MemberLesson.find({ memberId }).lean()
  res.json(items)
})

// DELETE /api/MemberLessons/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  
  // Validate id parameter
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid id parameter' })
  }
  
  const result = await MemberLesson.deleteOne({ id })
  if (result.deletedCount === 0) return res.status(404).json({ message: 'MemberLesson not found' })
  res.status(204).end()
})

function lessonDayOfWeek() { return '' }

// POST /api/MemberLessons/cleanup-expired
// Remove member lessons that are older than 1 week
router.post('/cleanup-expired', async (req, res) => {
  try {
    console.log('Starting cleanup of expired member lessons...')
    
    // Calculate date 1 week ago
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const oneWeekAgoString = oneWeekAgo.toISOString().split('T')[0] // YYYY-MM-DD format
    
    console.log(`Removing member lessons older than: ${oneWeekAgoString}`)
    
    // Find and delete expired member lessons
    const result = await MemberLesson.deleteMany({
      lessonDate: { $lt: oneWeekAgoString }
    })
    
    console.log(`Cleaned up ${result.deletedCount} expired member lessons`)
    
    res.json({ 
      cleaned: result.deletedCount, 
      cutoffDate: oneWeekAgoString,
      message: `Cleaned up ${result.deletedCount} expired member lessons older than ${oneWeekAgoString}` 
    })
  } catch (error) {
    console.error('Error cleaning up expired member lessons:', error)
    res.status(500).json({ error: 'Failed to clean up expired member lessons' })
  }
})

export default router


