/**
 * Check packages in database
 */

// Load environment variables
require('dotenv').config({ path: '../.env.local' })

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-tracker-multiuser'

async function checkPackages() {
  console.log('🔍 Checking packages in database...')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db()
    
    // Check all packages
    const allPackages = await db.collection('packages').find({}).toArray()
    console.log(`📦 Total packages in database: ${allPackages.length}`)
    
    if (allPackages.length > 0) {
      console.log('\n📋 All packages:')
      allPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. Name: ${pkg.name}`)
        console.log(`   Price: ${pkg.price}`)
        console.log(`   Lesson Count: ${pkg.lessonCount}`)
        console.log(`   User ID: ${pkg.userId || 'MISSING'}`)
        console.log(`   ID: ${pkg.id || 'MISSING'}`)
        console.log('   ---')
      })
      
      // Check packages by user
      console.log('\n👤 Packages by user:')
      const packagesWithUser = await db.collection('packages').find({ userId: { $exists: true } }).toArray()
      const packagesWithoutUser = await db.collection('packages').find({ userId: { $exists: false } }).toArray()
      
      console.log(`✅ Packages WITH userId: ${packagesWithUser.length}`)
      console.log(`❌ Packages WITHOUT userId: ${packagesWithoutUser.length}`)
      
      if (packagesWithoutUser.length > 0) {
        console.log('\n🔧 Fixing packages without userId...')
        
        // Assign missing packages to user 1 (admin)
        const result = await db.collection('packages').updateMany(
          { userId: { $exists: false } },
          { $set: { userId: 1 } }
        )
        
        console.log(`✅ Fixed ${result.modifiedCount} packages`)
      }
      
      // Check again after fix
      console.log('\n📊 Final check:')
      const user1Packages = await db.collection('packages').find({ userId: 1 }).toArray()
      const user2Packages = await db.collection('packages').find({ userId: 2 }).toArray()
      
      console.log(`👤 User 1 packages: ${user1Packages.length}`)
      user1Packages.forEach(pkg => {
        console.log(`   - ${pkg.name} (${pkg.price} TL, ${pkg.lessonCount} ders)`)
      })
      
      console.log(`👤 User 2 packages: ${user2Packages.length}`)
      user2Packages.forEach(pkg => {
        console.log(`   - ${pkg.name} (${pkg.price} TL, ${pkg.lessonCount} ders)`)
      })
    } else {
      console.log('\n📝 Creating sample packages...')
      
      const samplePackages = [
        { userId: 1, name: 'Aylık Paket', lessonCount: 8, price: 500 },
        { userId: 1, name: 'Haftalık Paket', lessonCount: 4, price: 300 },
        { userId: 1, name: 'Günlük Ders', lessonCount: 1, price: 80 },
        { userId: 2, name: 'Premium Paket', lessonCount: 12, price: 700 },
        { userId: 2, name: 'Başlangıç Paketi', lessonCount: 6, price: 400 }
      ]
      
      await db.collection('packages').insertMany(samplePackages)
      console.log('✅ Sample packages created')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

checkPackages().catch(console.error)
