import mongoose, { Schema, Document } from "mongoose"

export interface IAddress extends Document {
  user: mongoose.Types.ObjectId
  name: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export const AddressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "United States" },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export default mongoose.models.Address || mongoose.model<IAddress>("Address", AddressSchema)
