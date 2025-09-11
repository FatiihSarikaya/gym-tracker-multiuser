import mongoose, { Schema, models } from 'mongoose'

const MemberPackageSchema = new Schema(
  {
    id: { type: Number, index: true, unique: true },
    memberId: { type: Number, required: true, index: true },
    membershipType: { type: String, default: '' },
    packageName: { type: String, required: true },
    lessonCount: { type: Number, required: true },
    price: { type: Number, required: true },
    purchasedAt: { type: String, required: true },
    remainingLessons: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
  },
  { collection: 'memberPackages' }
)

const MemberPackage = models.MemberPackage || mongoose.model('MemberPackage', MemberPackageSchema)
export default MemberPackage


