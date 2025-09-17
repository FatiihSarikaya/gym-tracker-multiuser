import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import { getNextId } from '@/lib/sequence'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email, password, name, businessName, businessType } = req.body

    if (!email || !password || !name || !businessName) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    await dbConnect()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Get next user ID
    const userId = await getNextId(User)

    // Create user
    const user = new User({
      id: userId,
      email,
      password: hashedPassword,
      name,
      businessName,
      businessType: businessType || 'gym',
      role: 'owner',
      isActive: true,
      createdAt: new Date().toISOString(),
      businessSettings: {
        currency: 'TL',
        timezone: 'Europe/Istanbul',
        language: 'tr'
      }
    })

    await user.save()

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject()
    
    res.status(201).json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
