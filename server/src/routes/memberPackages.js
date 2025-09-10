import { Router } from 'express'
import MemberPackage from '../models/MemberPackage.js'
import Package from '../models/Package.js'
import { getNextId } from '../lib/sequence.js'
import Member from '../models/Member.js'

const router = Router()

// GET /api/MemberPackages/member/:memberId
router.get('/member/:memberId', async (req, res) => {
  const memberId = Number(req.params.memberId)
  const items = await MemberPackage.find({ memberId }).sort({ id: -1 }).lean()
  res.json(items)
})

// POST /api/MemberPackages/purchase
router.post('/purchase', async (req, res) => {
  const { memberId, packageName } = req.body || {}
  if (!memberId || !packageName) return res.status(400).json({ message: 'memberId and packageName are required' })
  const pack = await Package.findOne({ name: packageName }).lean()
  if (!pack) return res.status(404).json({ message: 'Package not found' })
  const now = new Date().toISOString()
  const Member = (await import('../models/Member.js')).default
  const member = await Member.findOne({ id: Number(memberId) })
  if (!member) return res.status(404).json({ message: 'Member not found' })

  // Enforce single-package rule
  const existingPackages = await MemberPackage.find({ memberId: Number(memberId) }).lean()
  if (existingPackages.length > 0) {
    return res.status(409).json({ message: 'Üyenin zaten bir paketi var. Yeni paket eklemek için önce mevcut paketi silin.' })
  }

  const doc = {
    id: await getNextId(MemberPackage),
    memberId: Number(memberId),
    membershipType: member.membershipType || '',
    packageName: pack.name,
    lessonCount: pack.lessonCount,
    price: pack.price,
    purchasedAt: now,
    remainingLessons: pack.lessonCount,
    isActive: true
  }
  await MemberPackage.create(doc)

  // Update member to reflect new package
  member.membershipType = pack.name
  member.membershipStartDate = now.split('T')[0]
  // Reset counters for new package
  member.totalLessons = pack.lessonCount || 0
  member.attendedCount = 0
  member.extraCount = 0
  member.remainingLessons = pack.lessonCount || 0
  await member.save()

  res.status(201).json(doc)
})

// POST /api/MemberPackages/backfill
// Create a synthetic package record for members who have totalLessons > 0
// but no entries in memberPackages yet. Useful to align historic data.
// DISABLED: This endpoint was causing duplicate packages
router.post('/backfill', async (req, res) => {
  res.status(410).json({ 
    message: 'This endpoint has been disabled to prevent duplicate packages. Use /cleanup-duplicates instead.',
    disabled: true 
  })
})

// POST /api/MemberPackages/backfill/:memberId
router.post('/backfill/:memberId', async (req, res) => {
  const memberId = Number(req.params.memberId)
  const m = await Member.findOne({ id: memberId }).lean()
  if (!m) return res.status(404).json({ message: 'Member not found' })
  const exists = await MemberPackage.findOne({ memberId: m.id }).lean()
  if (exists) return res.json({ created: 0, reason: 'exists' })
  const total = Number(m.totalLessons || 0)
  const remaining = Number(m.remainingLessons || 0)
  if (total <= 0 && remaining <= 0) return res.json({ created: 0, reason: 'no-lessons' })
  const now = new Date().toISOString()
  await MemberPackage.create({
    id: await getNextId(MemberPackage),
    memberId: m.id,
    membershipType: m.membershipType || '',
    packageName: m.membershipType || 'Paket',
    lessonCount: total || remaining,
    price: 0,
    purchasedAt: now,
    remainingLessons: remaining > 0 ? remaining : Math.max(total - (m.attendedCount || 0), 0),
  })
  return res.json({ created: 1 })
})

// Helper function to activate next package (imported from lessonAttendances logic)
const activateNextPackage = async (memberId) => {
  try {
    const packages = await MemberPackage.find({ memberId }).sort({ id: 1 }).lean()
    
    // Find the first inactive package (waiting package)
    for (const pkg of packages) {
      if (!pkg.isActive) {
        // Activate this package and reset remainingLessons to full
        await MemberPackage.updateOne(
          { id: pkg.id },
          { isActive: true, remainingLessons: pkg.lessonCount }
        )
        
        // Update member totals and membership type
        const member = await Member.findOne({ id: memberId })
        if (member) {
          member.totalLessons = (member.totalLessons || 0) + pkg.lessonCount
          member.remainingLessons = (member.remainingLessons || 0) + pkg.lessonCount
          member.membershipType = pkg.packageName // Update membership type to new package
          await member.save()
        }
        
        console.log(`Activated next package ${pkg.packageName} for member ${memberId}`)
        return pkg
      }
    }
    
    return null
  } catch (error) {
    console.error('Error activating next package:', error)
    return null
  }
}

// DELETE /api/MemberPackages/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    
    // Validate id parameter
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid id parameter' })
    }
    
    const packageToDelete = await MemberPackage.findOne({ id })
    if (!packageToDelete) {
      return res.status(404).json({ message: 'Package not found' })
    }
    
    const wasActive = packageToDelete.isActive
    const memberId = packageToDelete.memberId
    
    // Update member totals when deleting a package
    try {
      const member = await Member.findOne({ id: memberId })
      if (member) {
        // Single-package rule: deleting the package resets all counters regardless
        member.membershipType = 'Paketsiz'
        member.totalLessons = 0
        member.attendedCount = 0
        member.extraCount = 0
        member.remainingLessons = 0
        await member.save()
      }
    } catch (error) {
      console.error('Error updating member totals:', error)
    }
    
    // Delete the package
    await MemberPackage.deleteOne({ id })
    
    // If deleted package was active, activate next package
    if (wasActive) {
      await activateNextPackage(memberId)
    }
    
    // Final guard: if member has no packages, ensure counters are zeroed
    try {
      const remainingAfter = await MemberPackage.countDocuments({ memberId })
      if (remainingAfter === 0) {
        const member = await Member.findOne({ id: memberId })
        if (member) {
          member.membershipType = 'Paketsiz'
          member.totalLessons = 0
          member.attendedCount = 0
          member.extraCount = 0
          member.remainingLessons = 0
          await member.save()
        }
      }
    } catch {}
    
    res.status(204).end()
  } catch (error) {
    console.error('Error deleting package:', error)
    res.status(500).json({ error: 'Failed to delete package' })
  }
})

// POST /api/MemberPackages/cleanup-duplicates
// Remove duplicate packages for members (keep only the latest one)
router.post('/cleanup-duplicates', async (req, res) => {
  try {
    const members = await Member.find({}).lean()
    let cleaned = 0
    
    for (const member of members) {
      const packages = await MemberPackage.find({ memberId: member.id }).sort({ id: 1 })
      
      // Group packages by packageName
      const packageGroups = {}
      packages.forEach(pkg => {
        if (!packageGroups[pkg.packageName]) {
          packageGroups[pkg.packageName] = []
        }
        packageGroups[pkg.packageName].push(pkg)
      })
      
      // For each package name, keep only the latest one
      for (const [packageName, pkgList] of Object.entries(packageGroups)) {
        if (pkgList.length > 1) {
          // Sort by id (creation order) and keep the latest
          const sortedPackages = pkgList.sort((a, b) => b.id - a.id)
          const keepPackage = sortedPackages[0]
          const deletePackages = sortedPackages.slice(1)
          
          // Delete duplicate packages
          for (const pkg of deletePackages) {
            await MemberPackage.deleteOne({ id: pkg.id })
            cleaned += 1
          }
        }
      }
    }
    
    res.json({ cleaned, message: `Removed ${cleaned} duplicate packages` })
  } catch (error) {
    console.error('Error cleaning up duplicates:', error)
    res.status(500).json({ error: 'Failed to clean up duplicates' })
  }
})

// POST /api/MemberPackages/activate-waiting/:memberId
router.post('/activate-waiting/:memberId', async (req, res) => {
  try {
    const memberId = Number(req.params.memberId)
    
    // Check if member exists
    const Member = (await import('../models/Member.js')).default
    const member = await Member.findOne({ id: memberId }).lean()
    if (!member) {
      return res.status(404).json({ message: 'Member not found' })
    }
    
    // Check if member's package is finished
    const totalLessons = member.totalLessons || 0
    const attendedCount = member.attendedCount || 0
    const isPackageFinished = totalLessons === attendedCount && totalLessons > 0
    
    if (!isPackageFinished) {
      return res.status(400).json({ message: 'Member still has remaining lessons' })
    }
    
    // Try to activate waiting package
    const activatedPackage = await activateNextPackage(memberId)
    
    if (activatedPackage) {
      res.json({ 
        message: 'Waiting package activated successfully',
        package: activatedPackage
      })
    } else {
      res.status(404).json({ message: 'No waiting package found' })
    }
  } catch (error) {
    console.error('Error activating waiting package:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router


