import cron from 'node-cron'

const runtimePort = process.env.PORT || 5000
const baseUrl = process.env.BASE_URL || `http://localhost:${runtimePort}`

// Cleanup expired member lessons every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('Running scheduled cleanup of expired member lessons...')
    
    const response = await fetch(`${baseUrl}/api/MemberLessons/cleanup-expired`, {
      method: 'POST'
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('Scheduled cleanup completed:', result.message)
    } else {
      console.error('Scheduled cleanup failed:', response.statusText)
    }
  } catch (error) {
    console.error('Error in scheduled cleanup:', error)
  }
})

// Cleanup expired lessons every day at 2:30 AM
cron.schedule('30 2 * * *', async () => {
  try {
    console.log('Running scheduled cleanup of expired lessons...')
    
    const response = await fetch(`${baseUrl}/api/Lessons/cleanup-expired`, {
      method: 'POST'
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('Scheduled lessons cleanup completed:', result.message)
    } else {
      console.error('Scheduled lessons cleanup failed:', response.statusText)
    }
  } catch (error) {
    console.error('Error in scheduled lessons cleanup:', error)
  }
})

// Cleanup orphaned records every day at 3 AM
cron.schedule('0 3 * * *', async () => {
  try {
    console.log('Running scheduled cleanup of orphaned records...')
    
    const response = await fetch(`${baseUrl}/api/Members/cleanup-orphaned`, {
      method: 'POST'
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('Scheduled orphaned cleanup completed:', result.message)
    } else {
      console.error('Scheduled orphaned cleanup failed:', response.statusText)
    }
  } catch (error) {
    console.error('Error in scheduled orphaned cleanup:', error)
  }
})

console.log('Cleanup scheduler initialized')
