import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextApiRequest, NextApiResponse } from 'next'

export async function getCurrentUser(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user) {
    return null
  }
  
  return {
    id: parseInt(session.user.id),
    email: session.user.email,
    name: session.user.name,
    businessName: session.user.businessName,
    businessType: session.user.businessType,
    role: session.user.role
  }
}

export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  const user = await getCurrentUser(req, res)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}
