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
  const result = await MemberLesson.deleteOne({ id })
  if (result.deletedCount === 0) return res.status(404).json({ message: 'MemberLesson not found' })
  res.status(204).end()
})

function lessonDayOfWeek() { return '' }

export default router


