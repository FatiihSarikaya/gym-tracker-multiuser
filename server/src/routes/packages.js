import { Router } from 'express'
import Package from '../models/Package.js'

const router = Router()

// GET /api/Packages
router.get('/', async (req, res) => {
  const items = await Package.find({}).lean()
  res.json(items)
})

// POST /api/Packages/seed
router.post('/seed', async (req, res) => {
  const presets = [
    { name: 'Grup8', lessonCount: 8, price: 3000 },
    { name: 'Grup12', lessonCount: 12, price: 4500 },
    { name: 'Bireysel8', lessonCount: 8, price: 5000 },
    { name: 'Bireysel12', lessonCount: 12, price: 7500 },
    { name: 'Düet8', lessonCount: 8, price: 4000 },
    { name: 'Düet12', lessonCount: 12, price: 6000 }
  ]
  for (const p of presets) {
    await Package.updateOne({ name: p.name }, { $set: p }, { upsert: true })
  }
  const all = await Package.find({}).lean()
  res.status(201).json(all)
})

export default router


