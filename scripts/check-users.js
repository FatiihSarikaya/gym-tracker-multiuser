/**
 * Check users in database
 */

// Load environment variables
require('dotenv').config({ path: '../.env.local' })

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-tracker-multiuser'

async function checkUsers() {
  console.log('Checking users in database...')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db()
    const users = await db.collection('users').find({}).toArray()
    
    console.log(`📊 Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`)
    })
    
    if (users.length === 0) {
      console.log('⚠️ No users found! Running migration...')
      // Run migration
      const bcrypt = require('bcryptjs')
      
      const defaultUser = {
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
      
      await db.collection('users').insertOne(defaultUser)
      console.log('✅ Default user created')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

checkUsers().catch(console.error)
