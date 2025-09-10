import mongoose from 'mongoose'

const LessonAttendanceSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true },
    memberId: { type: Number, required: true },
    lessonId: { type: Number, required: true },
    lessonDate: { type: String, required: true },
    attended: { type: Boolean, default: false },
    type: { type: String, default: 'pakete-dahil' },
    packageId: { type: Number, default: null }, // Hangi paketten kullanıldı
    packageName: { type: String, default: '' }, // Paket adı (hızlı erişim için)
    notes: { type: String, default: '' },
    createdAt: { type: String }
  },
  { collection: 'lessonAttendances' }
)

export default mongoose.models.LessonAttendance || mongoose.model('LessonAttendance', LessonAttendanceSchema)


