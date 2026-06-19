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

    // 1. Clear database
    await User.deleteMany({})
    await Category.deleteMany({})
    await Product.deleteMany({})
    await Cart.deleteMany({})
    await Wishlist.deleteMany({})
    await Order.deleteMany({})
    await Review.deleteMany({})
    await Notification.deleteMany({})
    await InventoryLog.deleteMany({})

    // 2. Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 12)
    const customerPassword = await bcrypt.hash("customer123", 12)

    // 3. Create Users
    const admin = await User.create({
      name: "Admin Skincare",
      email: "admin@skincare.com",
      password: adminPassword,
      role: "admin",
      status: "active",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
    })

    const customer = await User.create({
      name: "Jane Doe",
      email: "customer@skincare.com",
      password: customerPassword,
      role: "customer",
      status: "active",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
    })

    // 4. Create Categories
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
    const categoryMap = categories.reduce((map: any, cat: any) => {
      map[cat.slug] = cat._id
      return map
    }, {})

    // 5. Create Products
    const productsData = [
      {
        name: "Gentle Hydrating Cleanser",
        slug: "gentle-hydrating-cleanser",
        description: "A non-foaming, creamy cleanser that removes impurities while keeping the skin barrier hydrated and soft.",
        price: 24.00,
        discount: 10,
        category: categoryMap["cleanser"],
        brand: "LumiSkin",
        stock: 45,
        ingredients: ["Purified Water", "Glycerin", "Ceramides AP/EOP", "Hyaluronic Acid", "Cetearyl Alcohol"],
        usageInstructions: "Apply to wet skin. Gently massage in circular motions, then rinse thoroughly with lukewarm water.",
        benefits: ["Cleanses without stripping moisture", "Restores protective skin barrier", "Fragrance-free and non-comedogenic"],
        tags: ["hydrating", "gentle", "daily"],
        skinType: ["sensitive", "dry", "combination", "all"],
        concernType: ["dryness", "redness"],
        isFeatured: true,
        images: [
          {
            public_id: "cleanse_1",
            secure_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop",
            alt: "Gentle Hydrating Cleanser"
          }
        ]
      },
      {
        name: "10% Niacinamide Glow Serum",
        slug: "10-niacinamide-glow-serum",
        description: "High-strength vitamin and mineral formula that visibly targets dark spots, uneven skin tone, and enlarged pores.",
        price: 36.00,
        discount: 0,
        category: categoryMap["serum"],
        brand: "Aura Skincare",
        stock: 3,
        ingredients: ["Water", "Niacinamide (10%)", "Zinc PCA (1%)", "Phenoxyethanol", "Xanthan Gum"],
        usageInstructions: "Apply a few drops to the entire face in the morning and evening before heavier creams.",
        benefits: ["Reduces appearance of skin blemishes", "Balances visible sebum activity", "Brightens skin complexion"],
        tags: ["brightening", "pores", "niacinamide"],
        skinType: ["oily", "combination", "dry", "all"],
        concernType: ["pores", "dullness", "dark-spots"],
        isFeatured: true,
        images: [
          {
            public_id: "serum_niacinamide",
            secure_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
            alt: "Niacinamide Glow Serum"
          }
        ]
      },
      {
        name: "Hyaluronic Acid Deep Moisture Gel",
        slug: "hyaluronic-acid-deep-moisture-gel",
        description: "An ultra-light, refreshing oil-free moisturizer that delivers instant hydration and locks it in for 48 hours.",
        price: 29.00,
        discount: 15,
        category: categoryMap["moisturizer"],
        brand: "LumiSkin",
        stock: 80,
        ingredients: ["Water", "Dimethicone", "Glycerin", "Sodium Hyaluronate", "Olive Extract"],
        usageInstructions: "Apply evenly to face and neck daily after cleansing. Smooth in gently until absorbed.",
        benefits: ["Provides instant 48-hour hydration", "Oil-free, non-greasy formula", "Smooth, supple skin finish"],
        tags: ["moisture", "hyaluronic", "gel"],
        skinType: ["dry", "combination", "oily", "all"],
        concernType: ["dryness"],
        isFeatured: true,
        images: [
          {
            public_id: "moisturizer_gel",
            secure_url: "https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=600&auto=format&fit=crop",
            alt: "Hyaluronic Acid Moisture Gel"
          }
        ]
      },
      {
        name: "Daily Defense SPF 50+ Sunscreen",
        slug: "daily-defense-spf-50-sunscreen",
        description: "A lightweight, mineral broad-spectrum sunscreen that shields skin from harmful UVA/UVB rays and pollution.",
        price: 32.00,
        discount: 0,
        category: categoryMap["sunscreen"],
        brand: "SolShield",
        stock: 120,
        ingredients: ["Zinc Oxide (20%)", "Titanium Dioxide", "Green Tea Extract", "Vitamin E", "Water"],
        usageInstructions: "Apply generously to face and neck 15 minutes before sun exposure. Reapply every 2 hours.",
        benefits: ["Broad-spectrum UVA/UVB protection", "No white cast, matte finish", "Antioxidant protection against pollution"],
        tags: ["sunscreen", "spf50", "uv-protection"],
        skinType: ["sensitive", "oily", "dry", "combination", "all"],
        concernType: ["anti-aging", "dark-spots"],
        isFeatured: true,
        images: [
          {
            public_id: "sunscreen_defense",
            secure_url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop",
            alt: "SPF 50 Sunscreen"
          }
        ]
      },
      {
        name: "Salicylic Acid Clarifying Toner",
        slug: "salicylic-acid-clarifying-toner",
        description: "BHA toner designed to sweep away dead skin cells, unclog pores, and calm redness for a balanced, clear skin.",
        price: 22.00,
        discount: 5,
        category: categoryMap["toner"],
        brand: "Aura Skincare",
        stock: 55,
        ingredients: ["Water", "Salicylic Acid (2%)", "Green Tea Extract", "Methylpropanediol", "Polysorbate 20"],
        usageInstructions: "Apply to a cotton pad and gently sweep over face and neck after cleansing. Do not rinse.",
        benefits: ["Unclogs and shrinks enlarged pores", "Clears blackheads and blemishes", "Calms redness and inflammation"],
        tags: ["toner", "exfoliator", "salicylic"],
        skinType: ["oily", "combination"],
        concernType: ["acne", "pores", "redness"],
        isFeatured: false,
        images: [
          {
            public_id: "toner_salicylic",
            secure_url: "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop",
            alt: "Clarifying BHA Toner"
          }
        ]
      },
      {
        name: "Advanced Retinol Night Cream",
        slug: "advanced-retinol-night-cream",
        description: "A nourishing overnight treatment with encapsulated retinol to reduce the appearance of fine lines, wrinkles, and age spots.",
        price: 48.00,
        discount: 20,
        category: categoryMap["moisturizer"],
        brand: "LumiSkin",
        stock: 32,
        ingredients: ["Water", "Caprylic Triglyceride", "Retinol (0.5%)", "Shea Butter", "Niacinamide", "Peptides"],
        usageInstructions: "Apply a pea-sized amount to clean skin at night. Start 2-3 times a week and build tolerance.",
        benefits: ["Visibly reduces fine lines and wrinkles", "Improves skin texture and elasticity", "Deeply hydrates during sleep"],
        tags: ["retinol", "night-cream", "anti-aging"],
        skinType: ["dry", "combination", "all"],
        concernType: ["anti-aging", "wrinkles", "uneven-tone"],
        isFeatured: true,
        images: [
          {
            public_id: "retinol_night",
            secure_url: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop",
            alt: "Retinol Night Cream"
          }
        ]
      }
    ]

    const products = await Product.insertMany(productsData)

    for (const prod of products) {
      await InventoryLog.create({
        product: prod._id,
        changeType: "adjustment",
        quantity: prod.stock,
        previousStock: 0,
        newStock: prod.stock,
        note: "Initial seed data insert"
      })
    }

    await Notification.create({
      user: null,
      type: "low_stock",
      title: "Low Stock Alert",
      message: `Product '10% Niacinamide Glow Serum' is running low (Stock: 3).`,
      link: `/admin/products/${products[1]._id}/edit`
    })

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      users: {
        admin: admin.email,
        customer: customer.email
      },
      categoriesCount: categories.length,
      productsCount: products.length
    })
  } catch (error: any) {
    console.error("Seeding Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
