import mongoose, { Schema, Document } from "mongoose"

export interface IReview extends Document {
  user: mongoose.Types.ObjectId
  product: mongoose.Types.ObjectId
  rating: number
  comment: string
  isVerifiedPurchase: boolean
  isHidden: boolean
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    isVerifiedPurchase: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export default mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema)
