import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Payment from '@/models/Payment'
import MemberPackage from '@/models/MemberPackage'
import Package from '@/models/Package'
import { getNextId } from '@/lib/sequence'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect()

    if (req.method === 'GET') {
      const items = await Payment.find({}).lean()
      return res.status(200).json(items)
    }

  if (req.method === 'POST') {
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
    try {
      if (payload.packageName) {
        const pack = await Package.findOne({ name: payload.packageName }).lean()
        if (pack) {
          const p: any = pack as any
          const existingPackage = await MemberPackage.findOne({ memberId: Number(payload.memberId), packageName: p.name })
          if (!existingPackage) {
            const pkgDoc = {
              id: await getNextId(MemberPackage),
              memberId: Number(payload.memberId),
              packageName: p.name,
              lessonCount: p.lessonCount,
              price: p.price,
              purchasedAt: now,
              remainingLessons: p.lessonCount,
            }
            await MemberPackage.create(pkgDoc)
          }
        }
      }
    } catch {}
    return res.status(201).json(payment)
  }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Error in Payments/index:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


