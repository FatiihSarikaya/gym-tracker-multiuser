import mongoose from 'mongoose'

const MemberLessonSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true },
    memberId: { type: Number, required: true, index: true },
    lessonId: { type: Number, required: true, index: true },
    // Days of week member attends this lesson, e.g., ["Mon","Wed"]
    daysOfWeek: { type: [String], default: [] },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null }
  },
  { collection: 'memberLessons' }
)

export default mongoose.models.MemberLesson || mongoose.model('MemberLesson', MemberLessonSchema)


