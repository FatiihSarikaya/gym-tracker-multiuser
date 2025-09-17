/**
 * Test user data isolation
 */

// Load environment variables
require('dotenv').config({ path: '../.env.local' })

const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-tracker-multiuser'

async function testUserIsolation() {
  console.log('🧪 Testing user data isolation...')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db()
    
    // Create test user 2 if doesn't exist
    const existingUser2 = await db.collection('users').findOne({ email: 'test@gymtracker.com' })
    if (!existingUser2) {
      const testUser = {
        id: 2,
        email: 'test@gymtracker.com',
        password: await bcrypt.hash('123456', 12),
        name: 'Test User',
        businessName: 'Test Gym',
        businessType: 'fitness_center',
        role: 'owner',
        isActive: true,
        createdAt: new Date().toISOString(),
        businessSettings: {
          currency: 'TL',
          timezone: 'Europe/Istanbul',
          language: 'tr'
        }
      }
      
      await db.collection('users').insertOne(testUser)
      console.log('✅ Created test user 2')
    }
    
    // Add test data for both users
    const testData = [
      // User 1 data
      { collection: 'members', data: { id: 1, userId: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', dateOfBirth: '1990-01-01', membershipStartDate: new Date().toISOString(), membershipType: 'Monthly', isActive: true, createdAt: new Date().toISOString() }},
      { collection: 'members', data: { id: 2, userId: 1, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', dateOfBirth: '1992-05-15', membershipStartDate: new Date().toISOString(), membershipType: 'Annual', isActive: true, createdAt: new Date().toISOString() }},
      
      // User 2 data
      { collection: 'members', data: { id: 3, userId: 2, firstName: 'Bob', lastName: 'Wilson', email: 'bob@example.com', dateOfBirth: '1988-12-03', membershipStartDate: new Date().toISOString(), membershipType: 'Weekly', isActive: true, createdAt: new Date().toISOString() }},
      { collection: 'members', data: { id: 4, userId: 2, firstName: 'Alice', lastName: 'Brown', email: 'alice@example.com', dateOfBirth: '1995-07-22', membershipStartDate: new Date().toISOString(), membershipType: 'Monthly', isActive: true, createdAt: new Date().toISOString() }},
    ]
    
    for (const item of testData) {
      const existing = await db.collection(item.collection).findOne({ id: item.data.id })
      if (!existing) {
        await db.collection(item.collection).insertOne(item.data)
        console.log(`✅ Added ${item.data.firstName} ${item.data.lastName} to user ${item.data.userId}`)
      }
    }
    
    // Check data isolation
    console.log('\n📊 Data isolation check:')
    
    const user1Members = await db.collection('members').find({ userId: 1 }).toArray()
    const user2Members = await db.collection('members').find({ userId: 2 }).toArray()
    
    console.log(`👤 User 1 (admin@gymtracker.com) has ${user1Members.length} members:`)
    user1Members.forEach(member => {
      console.log(`   - ${member.firstName} ${member.lastName}`)
    })
    
    console.log(`👤 User 2 (test@gymtracker.com) has ${user2Members.length} members:`)
    user2Members.forEach(member => {
      console.log(`   - ${member.firstName} ${member.lastName}`)
    })
    
    console.log('\n🎉 User data isolation test completed!')
    console.log('\n📋 Test login credentials:')
    console.log('User 1: admin@gymtracker.com / 123456')
    console.log('User 2: test@gymtracker.com / 123456')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await client.close()
  }
}

testUserIsolation().catch(console.error)


