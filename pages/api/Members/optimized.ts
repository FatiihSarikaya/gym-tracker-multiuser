import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Member from '@/models/Member'
import { requireAuth } from '@/lib/session'
import { apiResponse, paginateQuery, LEAN_FIELDS } from '@/lib/api-optimization'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireAuth(req, res)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await dbConnect()

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ message: 'Method Not Allowed' })
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const search = req.query.search as string || ''
    const filter = req.query.filter as string || 'active'

    // Build query
    const query: any = { userId: user.id }
    
    // Filter by active/inactive
    if (filter === 'active') {
      query.isActive = true
    } else if (filter === 'inactive') {
      query.isActive = false
    }
    // 'all' doesn't add filter

    // Search functionality
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex }
      ]
    }

    // Pagination
    const { skip, limit: finalLimit } = paginateQuery(page, limit)

    // Execute optimized queries in parallel
    const [members, totalCount] = await Promise.all([
      Member.find(query, LEAN_FIELDS.member)
        .sort({ lastName: 1, firstName: 1 }) // Alphabetical order
        .skip(skip)
        .limit(finalLimit)
        .lean(),
      Member.countDocuments(query)
    ])

    const response = {
      members,
      total: totalCount,
      page,
      limit: finalLimit,
      totalPages: Math.ceil(totalCount / finalLimit),
      hasMore: skip + members.length < totalCount
    }

    return apiResponse(res, response, 'dynamic')

  } catch (error) {
    console.error('Error in optimized members API:', error)
    return res.status(500).json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : 'Server error'
    })
  }
}
