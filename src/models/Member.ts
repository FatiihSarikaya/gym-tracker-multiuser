import mongoose, { Schema, models } from 'mongoose'

const MemberSchema = new Schema(
  {
    id: { type: Number, index: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, default: '' },
    dateOfBirth: { type: String, required: true },
    membershipStartDate: { type: String, required: true },
    membershipEndDate: { type: String, default: null },
    membershipType: { type: String, required: true },
    totalLessons: { type: Number, default: 0 },
    attendedCount: { type: Number, default: 0 },
    extraCount: { type: Number, default: 0 },
    remainingLessons: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: String },
    updatedAt: { type: String }
  },
  { collection: 'members' }
)

const Member = models.Member || mongoose.model('Member', MemberSchema)
export default Member


