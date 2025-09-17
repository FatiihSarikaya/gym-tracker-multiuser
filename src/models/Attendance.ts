import mongoose, { Schema, models } from 'mongoose'

const AttendanceSchema = new Schema(
  {
    id: { type: Number, index: true, unique: true },
    userId: { type: Number, required: true, index: true },
    memberId: { type: Number, required: true },
    checkInTime: { type: String, required: true },
    checkOutTime: { type: String, default: null },
    notes: { type: String, default: '' },
    createdAt: { type: String }
  },
  { collection: 'attendances' }
)

const Attendance = models.Attendance || mongoose.model('Attendance', AttendanceSchema)
export default Attendance


