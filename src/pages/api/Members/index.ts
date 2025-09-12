import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Member from '@/models/Member'
import { getNextId } from '@/lib/sequence'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect()

    if (req.method === 'GET') {
      const members = await Member.find({}).lean()
      return res.status(200).json(members)
    }

  if (req.method === 'POST') {
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
        if (initialLessons > 0) {
          const MemberPackage = (await import('@/models/MemberPackage')).default
          const existingPackage = await MemberPackage.findOne({ memberId: member.id, packageName })
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
            await MemberPackage.create(packageData)
          }
        }
      } catch (error) {
        console.error('Error creating member package:', error)
      }

      return res.status(201).json(member)
    } catch (err: any) {
      if (err && err.name === 'ValidationError') {
        const errors: Record<string, string> = {}
        for (const [k, v] of Object.entries(err.errors || {})) {
          // @ts-ignore
          errors[k] = (v as any)?.message || 'Geçersiz'
        }
        return res.status(400).json({ message: 'Validation error', errors })
      }
      console.error('POST /Members failed', err)
      return res.status(500).json({ message: 'Internal Server Error' })
    }
  }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Error in Members/index:', error)
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}


