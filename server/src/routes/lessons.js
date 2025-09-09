import { Router } from 'express'
import { nextId } from '../lib/db.js'
import Lesson from '../models/Lesson.js'
import { getNextId } from '../lib/sequence.js'

const router = Router()

// GET /api/Lessons
router.get('/', async (req, res) => {
  const items = await Lesson.find({}).lean()
  res.json(items)
})

// GET /api/Lessons/date/:date - Get lessons for a specific date
router.get('/date/:date', async (req, res) => {
  const targetDate = req.params.date
  
  const items = await Lesson.find({ 
    lessonDate: targetDate,
    isActive: true 
  }).lean()
  
  res.json(items)
})

// GET /api/Lessons/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const item = await Lesson.findOne({ id }).lean()
  if (!item) return res.status(404).json({ message: 'Lesson not found' })
  res.json(item)
})

// POST /api/Lessons
router.post('/', async (req, res) => {
  const payload = req.body || {}
  const now = new Date().toISOString()
  const lesson = {
    id: await getNextId(Lesson),
    name: payload.name,
    description: payload.description || '',
    instructor: payload.instructor,
    dayOfWeek: payload.dayOfWeek,
    startTime: payload.startTime,
    endTime: payload.endTime,
    maxCapacity: payload.maxCapacity,
    location: payload.location,
    lessonDate: payload.lessonDate,
    isActive: payload.isActive ?? true,
    createdAt: now,
    updatedAt: now
  }
  await Lesson.create(lesson)
  res.status(201).json(lesson)
})

// PUT /api/Lessons/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const updated = await Lesson.findOneAndUpdate(
    { id },
    { ...req.body, updatedAt: new Date().toISOString() },
    { new: false }
  )
  if (!updated) return res.status(404).json({ message: 'Lesson not found' })
  res.status(204).end()
})

// DELETE /api/Lessons/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const result = await Lesson.deleteOne({ id })
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Lesson not found' })
  res.status(204).end()
})

export default router



