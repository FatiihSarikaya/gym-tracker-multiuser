import { NextApiResponse } from 'next'

// Cache headers for different data types
export const CACHE_HEADERS = {
  // Static data (packages, lessons) - cache for 5 minutes
  static: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    'CDN-Cache-Control': 'public, s-maxage=300'
  },
  // Dynamic data (members, payments) - cache for 1 minute
  dynamic: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    'CDN-Cache-Control': 'public, s-maxage=60'
  },
  // Real-time data (attendance) - no cache
  realtime: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}

// Standardized API response with compression hints
export function apiResponse(res: NextApiResponse, data: any, type: 'static' | 'dynamic' | 'realtime' = 'dynamic') {
  const headers = { ...CACHE_HEADERS[type] }
  
  // Add compression hint for large responses
  if (JSON.stringify(data).length > 1000) {
    res.setHeader('Content-Encoding', 'gzip')
  }

  // Set performance headers
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  return res.json(data)
}

// Pagination helper for large datasets
export function paginateQuery(page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit
  return { skip, limit: Math.min(limit, 100) } // Max 100 items per request
}

// Field selection for lean queries
export const LEAN_FIELDS = {
  member: 'id firstName lastName phoneNumber email isActive membershipType',
  payment: 'id memberId status paymentDate dueDate amount',
  lesson: 'id name instructor startTime endTime lessonDate isActive',
  attendance: 'id memberId checkInTime notes'
}

// Query optimization wrapper
export function optimizeQuery(model: any, userId: number, options: {
  fields?: string
  populate?: string[]
  sort?: Record<string, 1 | -1>
  limit?: number
} = {}) {
  let query = model.find({ userId }, options.fields)
  
  if (options.populate) {
    options.populate.forEach(field => {
      query = query.populate(field)
    })
  }
  
  if (options.sort) {
    query = query.sort(options.sort)
  }
  
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  return query.lean() // Always use lean for performance
}

// Memory usage monitor
export function logMemoryUsage(operation: string) {
  if (process.env.NODE_ENV === 'development') {
    const used = process.memoryUsage()
    console.log(`📊 ${operation} - Memory Usage:`)
    for (let key in used) {
      console.log(`  ${key}: ${Math.round(used[key as keyof typeof used] / 1024 / 1024 * 100) / 100} MB`)
    }
  }
}
