import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

let isConnected = false

export async function connectMongo() {
  if (isConnected) return mongoose.connection

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gymtracker'
  const dbName = process.env.MONGODB_DB || undefined

  mongoose.set('strictQuery', true)

  await mongoose.connect(uri, { dbName })
  isConnected = true
  return mongoose.connection
}

export function disconnectMongo() {
  isConnected = false
  return mongoose.disconnect()
}


