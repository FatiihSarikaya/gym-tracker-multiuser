import mongoose, { Schema, models } from 'mongoose'

const UserSchema = new Schema(
  {
    id: { type: Number, index: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['owner', 'manager', 'trainer'], default: 'owner' },
    businessName: { type: String, required: true },
    businessType: { type: String, enum: ['gym', 'yoga_studio', 'pilates_studio', 'fitness_center', 'sports_club'], default: 'gym' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: String },
    updatedAt: { type: String },
    // Business settings
    businessSettings: {
      currency: { type: String, default: 'TL' },
      timezone: { type: String, default: 'Europe/Istanbul' },
      language: { type: String, default: 'tr' }
    }
  },
  { collection: 'users' }
)

const User = models.User || mongoose.model('User', UserSchema)
export default User
