import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
  throw new Error('⚠️ MONGODB_URI not set in environment variables')
}

// Use cached connection in serverless environments
let cached = (global as any).mongoose
if (!cached) {
  cached = (global as any).mongoose = { conn: null as mongoose.Connection | null, promise: null as Promise<mongoose.Connection> | null }
}

async function dbConnect(): Promise<mongoose.Connection> {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then(m => m.connection)
  }
  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect


