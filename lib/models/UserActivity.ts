import mongoose, { Schema, Document } from "mongoose"

export interface IUserActivity extends Document {
  user?: mongoose.Types.ObjectId | null
  activityType: "view_product" | "search" | "add_to_cart" | "purchase"
  productId?: mongoose.Types.ObjectId | null
  searchQuery?: string
  createdAt: Date
}

const UserActivitySchema = new Schema<IUserActivity>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    activityType: { type: String, enum: ["view_product", "search", "add_to_cart", "purchase"], required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    searchQuery: { type: String, default: "" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export default mongoose.models.UserActivity || mongoose.model<IUserActivity>("UserActivity", UserActivitySchema)
