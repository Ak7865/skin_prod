import mongoose, { Schema, Document } from "mongoose"

export interface IInventoryLog extends Document {
  product: mongoose.Types.ObjectId
  changeType: "sale" | "restock" | "adjustment"
  quantity: number
  previousStock: number
  newStock: number
  note?: string
  createdAt: Date
}

const InventoryLogSchema = new Schema<IInventoryLog>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    changeType: { type: String, enum: ["sale", "restock", "adjustment"], required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    note: { type: String, default: "" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export default mongoose.models.InventoryLog || mongoose.model<IInventoryLog>("InventoryLog", InventoryLogSchema)
