import mongoose from 'mongoose'

const LessonSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    instructor: { type: String, required: true },
    dayOfWeek: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    maxCapacity: { type: Number, required: true },
    location: { type: String, required: true },
    lessonDate: { type: String, required: true }, // Dersin gerçek tarihi (YYYY-MM-DD)
    isActive: { type: Boolean, default: true },
    createdAt: { type: String },
    updatedAt: { type: String }
  },
  { collection: 'lessons' }
)

export default mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema)


