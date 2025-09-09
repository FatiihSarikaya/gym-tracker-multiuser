import mongoose from 'mongoose'

const PackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    lessonCount: { type: Number, required: true },
    price: { type: Number, required: true }
  },
  { collection: 'packages' }
)

export default mongoose.models.Package || mongoose.model('Package', PackageSchema)


