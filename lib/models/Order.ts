import mongoose, { Schema, Document } from "mongoose"

export interface IOrderItem {
  product: mongoose.Types.ObjectId
  name: string
  price: number
  quantity: number
  image: string
}

export interface IOrderStatusHistory {
  status: "pending_confirmation" | "confirmed" | "shipping" | "tracking_updated" | "delivered" | "cancelled"
  changedAt: Date
  note?: string
}

export interface IOrderTracking {
  courierName?: string
  trackingId?: string
  shippingNote?: string
  estimatedDeliveryDate?: Date
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId
  items: IOrderItem[]
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
  }
  paymentMethod: {
    cardBrand: string
    last4: string
  }
  paymentStatus: "pending" | "paid" | "failed"
  totalPrice: number
  shippingPrice: number
  taxPrice: number
  grandTotal: number
  status: "pending_confirmation" | "confirmed" | "shipping" | "tracking_updated" | "delivered" | "cancelled"
  statusHistory: IOrderStatusHistory[]
  tracking?: IOrderTracking
  razorpayOrderId?: string
  razorpayPaymentId?: string
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true }
})

const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>({
  status: {
    type: String,
    enum: ["pending_confirmation", "confirmed", "shipping", "tracking_updated", "delivered", "cancelled"],
    required: true
  },
  changedAt: { type: Date, default: Date.now },
  note: { type: String, default: "" }
})

const OrderTrackingSchema = new Schema<IOrderTracking>({
  courierName: { type: String, default: "" },
  trackingId: { type: String, default: "" },
  shippingNote: { type: String, default: "" },
  estimatedDeliveryDate: { type: Date }
})

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true }
    },
    paymentMethod: {
      cardBrand: { type: String, required: true },
      last4: { type: String, required: true }
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    totalPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending_confirmation", "confirmed", "shipping", "tracking_updated", "delivered", "cancelled"],
      default: "pending_confirmation",
      index: true
    },
    statusHistory: { type: [OrderStatusHistorySchema], default: [] },
    tracking: { type: OrderTrackingSchema, default: {} },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String }
  },
  { timestamps: true }
)

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema)
