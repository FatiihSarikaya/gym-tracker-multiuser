/**
 * Test MongoDB connection
 */

// Load environment variables
require('dotenv').config({ path: '../.env.local' })

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-tracker-multiuser'

async function testConnection() {
  console.log('Testing MongoDB connection...')
  console.log('Connection URI:', MONGODB_URI)
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Successfully connected to MongoDB!')
    
    const db = client.db()
    console.log('✅ Database name:', db.databaseName)
    
    // List existing collections
    const collections = await db.listCollections().toArray()
    console.log('📁 Existing collections:', collections.map(c => c.name))
    
    // Test basic operation
    const testCollection = db.collection('connection_test')
    await testCollection.insertOne({ test: true, timestamp: new Date() })
    console.log('✅ Successfully performed write operation')
    
    // Clean up test document
    await testCollection.deleteOne({ test: true })
    console.log('✅ Successfully performed delete operation')
    
    console.log('\n🎉 Database connection is working perfectly!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('💡 Make sure MongoDB is running and the connection string is correct')
  } finally {
    await client.close()
  }
}

testConnection().catch(console.error)
