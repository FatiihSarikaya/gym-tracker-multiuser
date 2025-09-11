import mongoose, { Schema, models } from 'mongoose'

const PackageSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    lessonCount: { type: Number, required: true },
    price: { type: Number, required: true }
  },
  { collection: 'packages' }
)

const Package = models.Package || mongoose.model('Package', PackageSchema)
export default Package


