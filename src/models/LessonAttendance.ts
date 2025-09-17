import mongoose, { Schema, models } from 'mongoose'

const LessonAttendanceSchema = new Schema(
  {
    id: { type: Number, index: true, unique: true },
    userId: { type: Number, required: true, index: true },
    memberId: { type: Number, required: true },
    lessonId: { type: Number, required: true },
    lessonDate: { type: String, required: true },
    attended: { type: Boolean, required: true },
    type: { type: String, default: 'present' },
    notes: { type: String, default: '' },
    createdAt: { type: String }
  },
  { collection: 'lessonAttendances' }
)

const LessonAttendance = models.LessonAttendance || mongoose.model('LessonAttendance', LessonAttendanceSchema)
export default LessonAttendance


