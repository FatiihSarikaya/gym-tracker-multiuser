import mongoose from 'mongoose'

const PaymentSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true },
    memberId: { type: Number, required: true },
    amount: { type: Number, required: true },
    paymentType: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    paymentDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    status: { type: String, default: 'paid' },
    transactionId: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdAt: { type: String }
  },
  { collection: 'payments' }
)

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)


