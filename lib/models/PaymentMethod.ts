import mongoose, { Schema, Document } from "mongoose"

export interface IPaymentMethod extends Document {
  user: mongoose.Types.ObjectId
  cardBrand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  createdAt: Date
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cardBrand: { type: String, required: true },
    last4: { type: String, required: true },
    expiryMonth: { type: Number, required: true },
    expiryYear: { type: Number, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export default mongoose.models.PaymentMethod || mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema)
