import mongoose, { Schema, Document } from "mongoose"

export interface INotification extends Document {
  user?: mongoose.Types.ObjectId | null
  type: "new_order" | "accepted_order" | "rejected_order" | "tracking_updated" | "delivered_order" | "low_stock"
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    type: {
      type: String,
      enum: ["new_order", "accepted_order", "rejected_order", "tracking_updated", "delivered_order", "low_stock"],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: "" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)
