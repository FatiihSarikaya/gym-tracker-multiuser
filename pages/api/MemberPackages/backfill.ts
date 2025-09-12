import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  }
  return res.status(410).json({ 
    message: 'This endpoint has been disabled to prevent duplicate packages. Use /cleanup-duplicates instead.',
    disabled: true 
  })
}


