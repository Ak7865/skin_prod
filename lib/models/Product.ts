import mongoose, { Schema, Document } from "mongoose"

export interface IProductImage {
  public_id: string
  secure_url: string
  width?: number
  height?: number
  alt?: string
}

export interface IProduct extends Document {
  name: string
  slug: string
  description: string
  price: number
  discount: number
  images: IProductImage[]
  category: mongoose.Types.ObjectId
  brand: string
  stock: number
  ingredients: string[]
  usageInstructions: string
  benefits: string[]
  tags: string[]
  skinType: ("sensitive" | "oily" | "dry" | "combination" | "all")[]
  concernType: ("acne" | "anti-aging" | "dark-spots" | "dryness" | "pores" | "dullness" | "redness" | "wrinkles" | "uneven-tone")[]
  isFeatured: boolean
  rating: number
  numReviews: number
  createdAt: Date
  updatedAt: Date
}

const ProductImageSchema = new Schema<IProductImage>({
  public_id: { type: String, required: true },
  secure_url: { type: String, required: true },
  width: { type: Number },
  height: { type: Number },
  alt: { type: String, default: "" }
})

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 }, // Percentage discount
    images: { type: [ProductImageSchema], default: [] },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    ingredients: { type: [String], default: [] },
    usageInstructions: { type: String, default: "" },
    benefits: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    skinType: {
      type: [String],
      enum: ["sensitive", "oily", "dry", "combination", "all"],
      default: ["all"]
    },
    concernType: {
      type: [String],
      enum: ["acne", "anti-aging", "dark-spots", "dryness", "pores", "dullness", "redness", "wrinkles", "uneven-tone"],
      default: []
    },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
)

// Add Text Index for Search
ProductSchema.index({
  name: "text",
  brand: "text",
  description: "text",
  tags: "text",
  ingredients: "text"
})

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)
