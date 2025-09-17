/**
 * Migration script to convert single-user gym tracker to multi-user
 * This script adds userId field to existing documents and creates a default user
 */

const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

// Load environment variables
require('dotenv').config({ path: '../.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-tracker-multiuser'

async function migrate() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    
    // Create default user
    const defaultUserData = {
      id: 1,
      email: 'admin@gymtracker.com',
      password: await bcrypt.hash('123456', 12),
      name: 'Admin User',
      businessName: 'Demo Gym',
      businessType: 'gym',
      role: 'owner',
      isActive: true,
      createdAt: new Date().toISOString(),
      businessSettings: {
        currency: 'TL',
        timezone: 'Europe/Istanbul',
        language: 'tr'
      }
    }
    
    // Insert default user if doesn't exist
    const existingUser = await db.collection('users').findOne({ email: defaultUserData.email })
    if (!existingUser) {
      await db.collection('users').insertOne(defaultUserData)
      console.log('Default user created:', defaultUserData.email)
    }
    
    const defaultUserId = 1
    
    // Collections to migrate
    const collections = [
      'members',
      'attendances', 
      'payments',
      'lessons',
      'lessonAttendances',
      'memberLessons',
      'memberPackages',
      'packages'
    ]
    
    for (const collectionName of collections) {
      console.log(`Migrating collection: ${collectionName}`)
      
      // Add userId field to documents that don't have it
      const result = await db.collection(collectionName).updateMany(
        { userId: { $exists: false } },
        { $set: { userId: defaultUserId } }
      )
      
      console.log(`Updated ${result.modifiedCount} documents in ${collectionName}`)
    }
    
    // Create indexes for userId fields
    for (const collectionName of collections) {
      try {
        await db.collection(collectionName).createIndex({ userId: 1 })
        console.log(`Created userId index for ${collectionName}`)
      } catch (error) {
        console.log(`Index already exists for ${collectionName}`)
      }
    }
    
    console.log('Migration completed successfully!')
    console.log('Default login credentials:')
    console.log('Email: admin@gymtracker.com')
    console.log('Password: 123456')
    
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await client.close()
  }
}

// Run migration
migrate().catch(console.error)
