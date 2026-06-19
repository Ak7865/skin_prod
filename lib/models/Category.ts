import mongoose, { Schema, Document } from "mongoose"

export interface ICategory extends Document {
  name: string
  slug: string
  description?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { timestamps: true }
)

export default mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema)
