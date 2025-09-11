import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import MemberPackage from '@/models/MemberPackage'
import Member from '@/models/Member'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const members = await Member.find({}).lean()
  let cleaned = 0
  for (const member of members) {
    const packages = await MemberPackage.find({ memberId: member.id }).sort({ id: 1 })
    const packageGroups: Record<string, any[]> = {}
    packages.forEach(pkg => {
      if (!packageGroups[pkg.packageName]) packageGroups[pkg.packageName] = []
      packageGroups[pkg.packageName].push(pkg)
    })
    for (const [packageName, pkgList] of Object.entries(packageGroups)) {
      if (pkgList.length > 1) {
        const sortedPackages = (pkgList as any[]).sort((a, b) => b.id - a.id)
        const deletePackages = sortedPackages.slice(1)
        for (const pkg of deletePackages) {
          await MemberPackage.deleteOne({ id: pkg.id })
          cleaned += 1
        }
      }
    }
  }
  return res.json({ cleaned, message: `Removed ${cleaned} duplicate packages` })
}


