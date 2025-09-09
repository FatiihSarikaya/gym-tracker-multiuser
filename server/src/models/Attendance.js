import mongoose from 'mongoose'

const AttendanceSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true },
    memberId: { type: Number, required: true },
    checkInTime: { type: String, required: true },
    checkOutTime: { type: String, default: null },
    notes: { type: String, default: '' },
    createdAt: { type: String }
  },
  { collection: 'attendances' }
)

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema)


