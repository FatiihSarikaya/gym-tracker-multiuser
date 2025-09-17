import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string
const MONGODB_DB = process.env.MONGODB_DB as string | undefined

if (!MONGODB_URI) {
  throw new Error('⚠️ MONGODB_URI not set in environment variables')
}

// Global MongoDB connection cache
let cached = (global as any).mongoose
if (!cached) {
  cached = (global as any).mongoose = { conn: null as mongoose.Connection | null, promise: null as Promise<mongoose.Connection> | null }
}

async function dbConnect(): Promise<mongoose.Connection> {
  if (cached.conn) return cached.conn
  
  if (!cached.promise) {
    // Production-optimized connection options
    const options: any = {
      // Connection pool optimization for 600-700 users
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      // Performance optimizations
      retryWrites: true,
      w: 'majority',
      // Faster connection establishment
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 30000,
      // Buffer commands disabled for serverless
      bufferCommands: false,
    }
    
    // Ensure correct database is selected (Atlas collections may be in a specific DB)
    if (MONGODB_DB && MONGODB_DB.trim().length > 0) {
      options.dbName = MONGODB_DB.trim()
    }
    
    cached.promise = mongoose.connect(MONGODB_URI, options).then(m => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ MongoDB connected with production optimizations')
      }
      return m.connection
    })
  }
  
  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect

// Connection health check for monitoring
export async function checkDbHealth() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping()
      return { status: 'healthy', latency: Date.now() }
    }
    return { status: 'disconnected' }
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}


