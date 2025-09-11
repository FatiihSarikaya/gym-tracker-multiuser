import mongoose, { Schema, models } from 'mongoose'

const LessonSchema = new Schema(
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
    lessonDate: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: String },
    updatedAt: { type: String }
  },
  { collection: 'lessons' }
)

const Lesson = models.Lesson || mongoose.model('Lesson', LessonSchema)
export default Lesson


