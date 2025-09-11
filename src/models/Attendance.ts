import mongoose, { Schema, models } from 'mongoose'

const AttendanceSchema = new Schema(
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

const Attendance = models.Attendance || mongoose.model('Attendance', AttendanceSchema)
export default Attendance


