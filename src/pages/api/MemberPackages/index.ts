import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import MemberPackage from '@/models/MemberPackage'
import Package from '@/models/Package'
import { getNextId } from '@/lib/sequence'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  if (req.method === 'POST') {
    // This endpoint is disabled per original server
    return res.status(410).json({
      message: 'This endpoint has been disabled to prevent duplicate packages. Use /cleanup-duplicates instead.',
      disabled: true
    })
  }
  res.setHeader('Allow', ['POST'])
  return res.status(405).json({ message: 'Method Not Allowed' })
}


