import mongoose, { Schema, models } from 'mongoose'

const MemberLessonSchema = new Schema(
  {
    id: { type: Number, index: true, unique: true },
    userId: { type: Number, required: true, index: true },
    memberId: { type: Number, required: true, index: true },
    lessonId: { type: Number, required: true, index: true },
    daysOfWeek: { type: [String], default: [] },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null }
  },
  { collection: 'memberLessons' }
)

const MemberLesson = models.MemberLesson || mongoose.model('MemberLesson', MemberLessonSchema)
export default MemberLesson


