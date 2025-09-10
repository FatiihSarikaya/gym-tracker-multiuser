import { Router } from 'express'
import { nextId } from '../lib/db.js'
import Payment from '../models/Payment.js'
import { getNextId } from '../lib/sequence.js'
import MemberPackage from '../models/MemberPackage.js'
import Package from '../models/Package.js'

const router = Router()

// GET /api/Payments
router.get('/', async (req, res) => {
  const items = await Payment.find({}).lean()
  res.json(items)
})

// GET /api/Payments/member/:memberId
router.get('/member/:memberId', async (req, res) => {
  const memberId = Number(req.params.memberId)
  const list = await Payment.find({ memberId }).lean()
  res.json(list)
})

// POST /api/Payments
router.post('/', async (req, res) => {
  const payload = req.body || {}
  const now = new Date().toISOString()
  const payment = {
    id: await getNextId(Payment),
    memberId: payload.memberId,
    amount: payload.amount,
    paymentType: payload.paymentType,
    paymentMethod: payload.paymentMethod,
    paymentDate: payload.paymentDate || now,
    dueDate: payload.dueDate || now,
    status: payload.status || 'paid',
    transactionId: payload.transactionId || '',
    notes: payload.notes || '',
    createdAt: now
  }
  await Payment.create(payment)
  // If this payment is for a package purchase, also create a MemberPackage record
  try {
    if (payload.packageName) {
      const pack = await Package.findOne({ name: payload.packageName }).lean()
      if (pack) {
        // Check if package already exists for this member to avoid duplicates
        const existingPackage = await MemberPackage.findOne({ 
          memberId: Number(payload.memberId), 
          packageName: pack.name 
        })
        
        if (!existingPackage) {
          const pkgDoc = {
            id: await getNextId(MemberPackage),
            memberId: Number(payload.memberId),
            packageName: pack.name,
            lessonCount: pack.lessonCount,
            price: pack.price,
            purchasedAt: now,
            remainingLessons: pack.lessonCount,
          }
          await MemberPackage.create(pkgDoc)
        }
      }
    }
  } catch {}
  res.status(201).json(payment)
})

// PUT /api/Payments/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const updated = await Payment.findOneAndUpdate(
    { id },
    { ...req.body },
    { new: false }
  )
  if (!updated) return res.status(404).json({ message: 'Payment not found' })
  res.status(204).end()
})

// DELETE /api/Payments/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const result = await Payment.deleteOne({ id })
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Payment not found' })
  res.status(204).end()
})

// GET /api/Payments/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const item = await Payment.findOne({ id }).lean()
  if (!item) return res.status(404).json({ message: 'Payment not found' })
  res.json(item)
})

export default router


