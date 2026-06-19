"use server"

import dbConnect from "@/lib/db"
import Product from "@/lib/models/Product"
import Category from "@/lib/models/Category"
import Order from "@/lib/models/Order"
import User from "@/lib/models/User"
import Notification from "@/lib/models/Notification"
import InventoryLog from "@/lib/models/InventoryLog"
import Review from "@/lib/models/Review"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

async function verifyAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized access. Admin privileges required.")
  }
  return session.user.id
}

// -------------------------------------------------------------
// PRODUCT MANAGEMENT
// -------------------------------------------------------------
export async function createProduct(data: any) {
  try {
    await verifyAdmin()
    await dbConnect()

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    
    const existing = await Product.findOne({ slug })
    const uniqueSlug = existing ? `${slug}-${Date.now()}` : slug

    const product = new Product({
      ...data,
      slug: uniqueSlug
    })

    await product.save()

    await InventoryLog.create({
      product: product._id,
      changeType: "adjustment",
      quantity: product.stock,
      previousStock: 0,
      newStock: product.stock,
      note: "Initial stock load"
    })

    revalidatePath("/admin/products")
    return { success: true, productId: product._id.toString() }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateProduct(productId: string, data: any) {
  try {
    await verifyAdmin()
    await dbConnect()

    const product = await Product.findById(productId)
    if (!product) return { success: false, error: "Product not found" }

    const previousStock = product.stock
    const newStock = data.stock ?? product.stock

    Object.assign(product, data)
    await product.save()

    if (previousStock !== newStock) {
      await InventoryLog.create({
        product: product._id,
        changeType: "adjustment",
        quantity: newStock - previousStock,
        previousStock,
        newStock,
        note: "Admin stock update manual correction"
      })
    }

    revalidatePath("/admin/products")
    revalidatePath(`/products/${productId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteProduct(productId: string) {
  try {
    await verifyAdmin()
    await dbConnect()
    await Product.findByIdAndDelete(productId)
    revalidatePath("/admin/products")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// CATEGORY MANAGEMENT
// -------------------------------------------------------------
export async function createCategory(formData: FormData) {
  try {
    await verifyAdmin()
    await dbConnect()

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const image = formData.get("image") as string

    if (!name) return { success: false, error: "Category name is required" }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    const category = new Category({
      name,
      slug,
      description,
      image
    })

    await category.save()
    revalidatePath("/admin/categories")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    await verifyAdmin()
    await dbConnect()
    await Category.findByIdAndDelete(categoryId)
    revalidatePath("/admin/categories")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// ORDER MANAGEMENT
// -------------------------------------------------------------
export async function updateOrderStatus(orderId: string, status: string, note?: string) {
  try {
    await verifyAdmin()
    await dbConnect()

    const order = await Order.findById(orderId)
    if (!order) return { success: false, error: "Order not found" }

    order.status = status
    order.statusHistory.push({ status, changedAt: new Date(), note })
    await order.save()

    await Notification.create({
      user: order.user,
      type: status === "confirmed" ? "accepted_order" : status === "cancelled" ? "rejected_order" : "tracking_updated",
      title: `Order Update: ${status.replace("_", " ").toUpperCase()}`,
      message: `Your Order #${order._id.toString().slice(-6).toUpperCase()} is now ${status.replace("_", " ")}.`,
      link: `/orders/${order._id}`
    })

    revalidatePath("/admin/orders")
    revalidatePath(`/orders/${orderId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateOrderTracking(orderId: string, trackingData: {
  courierName: string
  trackingId: string
  shippingNote: string
  estimatedDeliveryDate: Date
}) {
  try {
    await verifyAdmin()
    await dbConnect()

    const order = await Order.findById(orderId)
    if (!order) return { success: false, error: "Order not found" }

    order.tracking = trackingData
    order.status = "tracking_updated"
    order.statusHistory.push({
      status: "tracking_updated",
      changedAt: new Date(),
      note: `Courier: ${trackingData.courierName}, Tracking ID: ${trackingData.trackingId}`
    })
    await order.save()

    await Notification.create({
      user: order.user,
      type: "tracking_updated",
      title: "Shipping Tracking Updated",
      message: `Your Order #${order._id.toString().slice(-6).toUpperCase()} tracking has been updated: ${trackingData.courierName} (${trackingData.trackingId}).`,
      link: `/orders/${order._id}`
    })

    revalidatePath("/admin/orders")
    revalidatePath(`/orders/${orderId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// CUSTOMER MANAGEMENT
// -------------------------------------------------------------
export async function toggleUserStatus(userId: string) {
  try {
    await verifyAdmin()
    await dbConnect()

    const user = await User.findById(userId)
    if (!user) return { success: false, error: "User not found" }

    if (user.role === "admin") {
      return { success: false, error: "Cannot modify status of another administrator" }
    }

    user.status = user.status === "active" ? "inactive" : "active"
    await user.save()

    revalidatePath("/admin/customers")
    return { success: true, status: user.status }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
export async function getAdminNotifications() {
  try {
    await verifyAdmin()
    await dbConnect()
    const notifications = await Notification.find({ user: null })
      .sort({ createdAt: -1 })
      .limit(20)
    return { success: true, notifications: JSON.parse(JSON.stringify(notifications)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await verifyAdmin()
    await dbConnect()
    await Notification.findByIdAndUpdate(notificationId, { isRead: true })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function markAllNotificationsAsRead() {
  try {
    await verifyAdmin()
    await dbConnect()
    await Notification.updateMany({ user: null, isRead: false }, { isRead: true })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// REVIEW MANAGEMENT
// -------------------------------------------------------------
export async function toggleReviewVisibility(reviewId: string) {
  try {
    await verifyAdmin()
    await dbConnect()

    const review = await Review.findById(reviewId)
    if (!review) return { success: false, error: "Review not found" }

    review.isHidden = !review.isHidden
    await review.save()

    const productId = review.product
    const allReviews = await Review.find({ product: productId, isHidden: false })
    const numReviews = allReviews.length
    const avgRating = numReviews > 0 ? (allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / numReviews) : 0

    await Product.findByIdAndUpdate(productId, {
      rating: parseFloat(avgRating.toFixed(1)),
      numReviews
    })

    revalidatePath(`/products/${productId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
