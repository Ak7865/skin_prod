import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/lib/models/User"
import Category from "@/lib/models/Category"
import Product from "@/lib/models/Product"
import Cart from "@/lib/models/Cart"
import Wishlist from "@/lib/models/Wishlist"
import Order from "@/lib/models/Order"
import Review from "@/lib/models/Review"
import Notification from "@/lib/models/Notification"
import InventoryLog from "@/lib/models/InventoryLog"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await dbConnect()

    // 1. Clear all e-commerce collections
    await User.deleteMany({})
    await Category.deleteMany({})
    await Product.deleteMany({})
    await Cart.deleteMany({})
    await Wishlist.deleteMany({})
    await Order.deleteMany({})
    await Review.deleteMany({})
    await Notification.deleteMany({})
    await InventoryLog.deleteMany({})

    // 2. Hash administrator password
    const adminPassword = await bcrypt.hash("Admin123", 12)

    // 3. Create Admin User
    const admin = await User.create({
      name: "Administrator",
      email: "admin@gmail.com",
      password: adminPassword,
      role: "admin",
      status: "active",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
    })

    // 4. Create Standard Categories (Organizational metadata)
    const categoriesData = [
      {
        name: "Cleanser",
        slug: "cleanser",
        description: "Gentle and deep-cleansing formulas for clear, refreshed skin.",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400&auto=format&fit=crop"
      },
      {
        name: "Serum",
        slug: "serum",
        description: "Concentrated active ingredients targeting specific skin concerns.",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&auto=format&fit=crop"
      },
      {
        name: "Moisturizer",
        slug: "moisturizer",
        description: "Hydrating creams and lotions to lock in moisture and protect skin barrier.",
        image: "https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=400&auto=format&fit=crop"
      },
      {
        name: "Sunscreen",
        slug: "sunscreen",
        description: "Broad-spectrum UV protection to prevent sun damage and aging.",
        image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=400&auto=format&fit=crop"
      },
      {
        name: "Toner",
        slug: "toner",
        description: "Balancing and refining lotions to prepare skin for hydration.",
        image: "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=400&auto=format&fit=crop"
      }
    ]

    const categories = await Category.insertMany(categoriesData)

    return NextResponse.json({
      success: true,
      message: "Database successfully cleared of sample products and customers! Admin account initialized.",
      users: {
        admin: admin.email
      },
      categoriesCount: categories.length,
      productsCount: 0
    })
  } catch (error: any) {
    console.error("Seeding Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
