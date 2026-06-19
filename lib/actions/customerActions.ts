"use server"

import dbConnect from "@/lib/db"
import Cart from "@/lib/models/Cart"
import Wishlist from "@/lib/models/Wishlist"
import Address from "@/lib/models/Address"
import PaymentMethod from "@/lib/models/PaymentMethod"
import Order from "@/lib/models/Order"
import Product from "@/lib/models/Product"
import Review from "@/lib/models/Review"
import Notification from "@/lib/models/Notification"
import InventoryLog from "@/lib/models/InventoryLog"
import UserActivity from "@/lib/models/UserActivity"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import mongoose from "mongoose"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

// Check Auth helper
async function getAuthenticatedUser() {
  const session = await auth()
  if (!session || !session.user?.id) {
    throw new Error("You must be logged in to perform this action")
  }
  return session.user.id
}

// -------------------------------------------------------------
// CART ACTIONS
// -------------------------------------------------------------
export async function getCart() {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()
    const cart = await Cart.findOne({ user: userId }).populate("items.product")
    return { success: true, cart: cart ? JSON.parse(JSON.stringify(cart)) : { items: [] } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addToCart(productId: string, quantity: number = 1) {
  const session = await auth()
  if (!session || !session.user?.id) {
    const headersList = await headers()
    const referer = headersList.get("referer")
    let callbackUrl = "/"
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        callbackUrl = refererUrl.pathname + refererUrl.search
      } catch (e) {
        // ignore
      }
    }
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const userId = session.user.id
  try {
    await dbConnect()

    const product = await Product.findById(productId)
    if (!product || product.stock < quantity) {
      return { success: false, error: "Insufficient stock available" }
    }

    let cart = await Cart.findOne({ user: userId })
    if (!cart) {
      cart = new Cart({ user: userId, items: [] })
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item.product.toString() === productId
    )

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + quantity
      if (product.stock < newQty) {
        return { success: false, error: "Insufficient stock available" }
      }
      cart.items[itemIndex].quantity = newQty
    } else {
      cart.items.push({ product: productId, quantity })
    }

    await cart.save()
    
    // Log Activity
    await UserActivity.create({
      user: userId,
      activityType: "add_to_cart",
      productId
    })

    revalidatePath("/cart")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateCartQuantity(productId: string, quantity: number) {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()

    if (quantity < 1) return removeFromCart(productId)

    const product = await Product.findById(productId)
    if (!product || product.stock < quantity) {
      return { success: false, error: "Insufficient stock available" }
    }

    const cart = await Cart.findOne({ user: userId })
    if (!cart) return { success: false, error: "Cart not found" }

    const itemIndex = cart.items.findIndex(
      (item: any) => item.product.toString() === productId
    )

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity
      await cart.save()
      revalidatePath("/cart")
      return { success: true }
    }

    return { success: false, error: "Item not found in cart" }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function removeFromCart(productId: string) {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()

    const cart = await Cart.findOne({ user: userId })
    if (!cart) return { success: false, error: "Cart not found" }

    cart.items = cart.items.filter(
      (item: any) => item.product.toString() !== productId
    )

    await cart.save()
    revalidatePath("/cart")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// WISHLIST ACTIONS
// -------------------------------------------------------------
export async function getWishlist() {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()
    const wishlist = await Wishlist.findOne({ user: userId }).populate("products")
    return { success: true, wishlist: wishlist ? JSON.parse(JSON.stringify(wishlist)) : { products: [] } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleWishlist(productId: string) {
  const session = await auth()
  if (!session || !session.user?.id) {
    const headersList = await headers()
    const referer = headersList.get("referer")
    let callbackUrl = "/"
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        callbackUrl = refererUrl.pathname + refererUrl.search
      } catch (e) {
        // ignore
      }
    }
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const userId = session.user.id
  try {
    await dbConnect()

    let wishlist = await Wishlist.findOne({ user: userId })
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] })
    }

    const prodIdObj = new mongoose.Types.ObjectId(productId)
    const isSaved = wishlist.products.some((id: any) => id.toString() === productId)

    if (isSaved) {
      wishlist.products = wishlist.products.filter((id: any) => id.toString() !== productId)
    } else {
      wishlist.products.push(prodIdObj)
    }

    await wishlist.save()
    revalidatePath("/wishlist")
    revalidatePath(`/products/${productId}`)
    return { success: true, saved: !isSaved }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addToWishlist(productId: string) {
  const session = await auth()
  if (!session || !session.user?.id) {
    const headersList = await headers()
    const referer = headersList.get("referer")
    let callbackUrl = "/"
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        callbackUrl = refererUrl.pathname + refererUrl.search
      } catch (e) {
        // ignore
      }
    }
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const userId = session.user.id
  try {
    await dbConnect()

    let wishlist = await Wishlist.findOne({ user: userId })
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] })
    }

    const prodIdObj = new mongoose.Types.ObjectId(productId)
    const isSaved = wishlist.products.some((id: any) => id.toString() === productId)

    if (!isSaved) {
      wishlist.products.push(prodIdObj)
      await wishlist.save()
    }
    revalidatePath("/wishlist")
    revalidatePath(`/products/${productId}`)
    return { success: true, saved: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function buyNow(productId: string, quantity: number = 1) {
  const session = await auth()
  if (!session || !session.user?.id) {
    const headersList = await headers()
    const referer = headersList.get("referer")
    let callbackUrl = "/"
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        callbackUrl = refererUrl.pathname + refererUrl.search
      } catch (e) {
        // ignore
      }
    }
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const userId = session.user.id
  try {
    await dbConnect()

    const product = await Product.findById(productId)
    if (!product || product.stock < quantity) {
      return { success: false, error: "Insufficient stock available" }
    }

    let cart = await Cart.findOne({ user: userId })
    if (!cart) {
      cart = new Cart({ user: userId, items: [] })
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item.product.toString() === productId
    )

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity
    } else {
      cart.items.push({ product: productId, quantity })
    }

    await cart.save()
    revalidatePath("/cart")
    revalidatePath("/checkout")
  } catch (error: any) {
    return { success: false, error: error.message }
  }

  redirect("/checkout")
}

// -------------------------------------------------------------
// ADDRESS ACTIONS
// -------------------------------------------------------------
export async function getAddresses() {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()
    const addresses = await Address.find({ user: userId })
    return { success: true, addresses: JSON.parse(JSON.stringify(addresses)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveAddress(formData: FormData) {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()

    const addressId = formData.get("id") as string
    const name = formData.get("name") as string
    const street = formData.get("street") as string
    const city = formData.get("city") as string
    const state = formData.get("state") as string
    const postalCode = formData.get("postalCode") as string
    const country = formData.get("country") as string
    const phone = formData.get("phone") as string
    const isDefault = formData.get("isDefault") === "true"

    if (isDefault) {
      // Set all other addresses default=false
      await Address.updateMany({ user: userId }, { isDefault: false })
    }

    if (addressId) {
      const updated = await Address.findOneAndUpdate(
        { _id: addressId, user: userId },
        { name, street, city, state, postalCode, country, phone, isDefault },
        { new: true }
      )
      if (!updated) return { success: false, error: "Address not found" }
    } else {
      const newAddress = new Address({
        user: userId,
        name,
        street,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault
      })
      await newAddress.save()
    }

    revalidatePath("/profile")
    revalidatePath("/checkout")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteAddress(addressId: string) {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()
    await Address.findOneAndDelete({ _id: addressId, user: userId })
    revalidatePath("/profile")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// PAYMENT METHOD (METADATA) ACTIONS
// -------------------------------------------------------------
export async function getPaymentMethods() {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()
    const cards = await PaymentMethod.find({ user: userId })
    return { success: true, cards: JSON.parse(JSON.stringify(cards)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function savePaymentMethod(formData: FormData) {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()

    const cardBrand = formData.get("cardBrand") as string
    const last4 = formData.get("last4") as string
    const expiryMonth = parseInt(formData.get("expiryMonth") as string)
    const expiryYear = parseInt(formData.get("expiryYear") as string)

    const newCard = new PaymentMethod({
      user: userId,
      cardBrand,
      last4,
      expiryMonth,
      expiryYear
    })

    await newCard.save()
    revalidatePath("/profile")
    revalidatePath("/checkout")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// CHECKOUT & ORDER ACTIONS
// -------------------------------------------------------------
export async function placeOrder(formData: FormData) {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()

    const addressId = formData.get("addressId") as string
    const cardId = formData.get("cardId") as string

    // Validate checkout details
    const address = await Address.findOne({ _id: addressId, user: userId })
    if (!address) return { success: false, error: "Please select a shipping address" }

    const card = await PaymentMethod.findOne({ _id: cardId, user: userId })
    if (!card) return { success: false, error: "Please select a payment card" }

    const cart = await Cart.findOne({ user: userId }).populate("items.product")
    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Your shopping cart is empty" }
    }

    // Double check stock and construct order items
    const orderItems: any[] = []
    let totalAccumulator = 0

    for (const item of cart.items) {
      const prod = item.product as any
      if (!prod || prod.stock < item.quantity) {
        return { success: false, error: `Product '${prod?.name || "Unknown"}' is out of stock.` }
      }
      
      const priceAfterDiscount = prod.price * (1 - prod.discount / 100)
      orderItems.push({
        product: prod._id,
        name: prod.name,
        price: priceAfterDiscount,
        quantity: item.quantity,
        image: prod.images[0]?.secure_url || ""
      })
      totalAccumulator += priceAfterDiscount * item.quantity
    }

    // Financial breakdown
    const shippingPrice = totalAccumulator > 50 ? 0 : 5 // Free shipping over $50
    const taxPrice = parseFloat((totalAccumulator * 0.08).toFixed(2)) // 8% sales tax
    const grandTotal = parseFloat((totalAccumulator + shippingPrice + taxPrice).toFixed(2))

    // Transactions - update stocks & write inventory logs
    for (const item of cart.items) {
      const prod = item.product as any
      const oldStock = prod.stock
      const newStock = oldStock - item.quantity
      
      prod.stock = newStock
      await prod.save()

      // Log Stock change
      await InventoryLog.create({
        product: prod._id,
        changeType: "sale",
        quantity: -item.quantity,
        previousStock: oldStock,
        newStock: newStock,
        note: `Order checkout for user ${userId}`
      })
    }

    // Create the Order
    const newOrder = new Order({
      user: userId,
      items: orderItems,
      shippingAddress: {
        name: address.name,
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone
      },
      paymentMethod: {
        cardBrand: card.cardBrand,
        last4: card.last4
      },
      paymentStatus: "paid", // Mocked as paid instantly
      totalPrice: parseFloat(totalAccumulator.toFixed(2)),
      shippingPrice,
      taxPrice,
      grandTotal,
      status: "pending_confirmation",
      statusHistory: [{ status: "pending_confirmation", note: "Order placed successfully" }]
    })

    await newOrder.save()

    // Trigger Admin Notification
    await Notification.create({
      user: null, // Broadcast to all admins
      type: "new_order",
      title: "New Order Placed",
      message: `Order #${newOrder._id.toString().slice(-6).toUpperCase()} has been placed for a total of $${grandTotal}.`,
      link: `/admin/orders/${newOrder._id}`
    })

    // Empty User Cart
    cart.items = []
    await cart.save()

    // Log Activity
    await UserActivity.create({
      user: userId,
      activityType: "purchase",
      productId: orderItems[0].product
    })

    revalidatePath("/orders")
    revalidatePath("/cart")
    
    // Check low stock alerts
    for (const item of orderItems) {
      const updatedProd = await Product.findById(item.product)
      if (updatedProd && updatedProd.stock <= 5) {
        await Notification.create({
          user: null,
          type: "low_stock",
          title: "Low Stock Alert",
          message: `Product '${updatedProd.name}' is running low (Stock: ${updatedProd.stock}).`,
          link: `/admin/products/${updatedProd._id}/edit`
        })
      }
    }

    return { success: true, orderId: newOrder._id.toString() }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function placeRazorpayOrder(formData: FormData) {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()

    const addressId = formData.get("addressId") as string

    const address = await Address.findOne({ _id: addressId, user: userId })
    if (!address) return { success: false, error: "Please select a shipping address" }

    const cart = await Cart.findOne({ user: userId }).populate("items.product")
    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Your shopping cart is empty" }
    }

    const orderItems: any[] = []
    let totalAccumulator = 0

    for (const item of cart.items) {
      const prod = item.product as any
      if (!prod || prod.stock < item.quantity) {
        return { success: false, error: `Product '${prod?.name || "Unknown"}' is out of stock.` }
      }

      const priceAfterDiscount = prod.price * (1 - prod.discount / 100)
      orderItems.push({
        product: prod._id,
        name: prod.name,
        price: priceAfterDiscount,
        quantity: item.quantity,
        image: prod.images[0]?.secure_url || ""
      })
      totalAccumulator += priceAfterDiscount * item.quantity
    }

    const shippingPrice = totalAccumulator > 50 ? 0 : 5
    const taxPrice = parseFloat((totalAccumulator * 0.08).toFixed(2))
    const grandTotal = parseFloat((totalAccumulator + shippingPrice + taxPrice).toFixed(2))

    const newOrder = new Order({
      user: userId,
      items: orderItems,
      shippingAddress: {
        name: address.name,
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone
      },
      paymentStatus: "pending",
      totalPrice: parseFloat(totalAccumulator.toFixed(2)),
      shippingPrice,
      taxPrice,
      grandTotal,
      status: "pending_confirmation",
      statusHistory: [{ status: "pending_confirmation", note: "Order placed successfully" }]
    })

    await newOrder.save()

    return { success: true, orderId: newOrder._id.toString() }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getOrders() {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getOrderDetails(orderId: string) {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()
    const order = await Order.findOne({ _id: orderId, user: userId })
    if (!order) return { success: false, error: "Order not found" }
    return { success: true, order: JSON.parse(JSON.stringify(order)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// REVIEW ACTIONS
// -------------------------------------------------------------
export async function submitReview(formData: FormData) {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()

    const productId = formData.get("productId") as string
    const rating = parseInt(formData.get("rating") as string)
    const comment = formData.get("comment") as string

    if (!productId || isNaN(rating) || rating < 1 || rating > 5 || !comment) {
      return { success: false, error: "Invalid rating fields or empty comment" }
    }

    const existingReview = await Review.findOne({ user: userId, product: productId })
    if (existingReview) {
      return { success: false, error: "You have already reviewed this product" }
    }

    // Mark the review as verified when the customer has a delivered order containing the product.
    const deliveredOrder = await Order.findOne({
      user: userId,
      status: "delivered",
      "items.product": productId
    })

    const isVerifiedPurchase = !!deliveredOrder

    // Create the Review
    const newReview = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
      isVerifiedPurchase
    })
    await newReview.save()

    // Recompute product average rating
    const allReviews = await Review.find({ product: productId, isHidden: false })
    const numReviews = allReviews.length
    const avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / numReviews

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

// -------------------------------------------------------------
// NOTIFICATION ACTIONS
// -------------------------------------------------------------
export async function getCustomerNotifications() {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20)
    return { success: true, notifications: JSON.parse(JSON.stringify(notifications)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function markCustomerNotificationAsRead(notificationId: string) {
  try {
    const userId = await getAuthenticatedUser()
    await dbConnect()
    await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true }
    )
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
