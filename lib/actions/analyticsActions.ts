"use server"

import dbConnect from "@/lib/db"
import Order from "@/lib/models/Order"
import Product from "@/lib/models/Product"
import { auth } from "@/auth"

async function verifyAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized access")
  }
}

export async function getAnalyticsData(startDateStr?: string, endDateStr?: string) {
  try {
    await verifyAdmin()
    await dbConnect()

    const start = startDateStr ? new Date(startDateStr) : new Date(new Date().setDate(new Date().getDate() - 30))
    const end = endDateStr ? new Date(endDateStr) : new Date()
    end.setHours(23, 59, 59, 999)

    const dateMatch = {
      createdAt: { $gte: start, $lte: end }
    }

    // 1. KPI Cards data
    const ordersAgg = await Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalSales: { $sum: { $size: "$items" } },
          ordersCount: { $sum: 1 },
          deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          pendingOrders: { $sum: { $cond: [{ $in: ["$status", ["pending_confirmation", "confirmed", "shipping", "tracking_updated"]] }, 1, 0] } }
        }
      }
    ])

    const kpis = ordersAgg[0] || {
      totalRevenue: 0,
      totalSales: 0,
      ordersCount: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0
    }

    const avgOrderValue = kpis.ordersCount > 0 ? parseFloat((kpis.totalRevenue / kpis.ordersCount).toFixed(2)) : 0

    // 2. Sales by period for trend analysis
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    let groupFormat = "%Y-%m-%d"
    if (diffDays > 30 && diffDays <= 365) {
      groupFormat = "%Y-%U"
    } else if (diffDays > 365) {
      groupFormat = "%Y-%m"
    }

    const salesTrendAgg = await Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          revenue: { $sum: "$grandTotal" },
          sales: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    const salesTrend = salesTrendAgg.map((item) => ({
      date: item._id,
      revenue: parseFloat(item.revenue.toFixed(2)),
      orders: item.sales
    }))

    // 3. Best Selling Products
    const bestSellers = await Order.aggregate([
      { $match: dateMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ])

    // 4. Top Categories
    const topCategories = await Order.aggregate([
      { $match: dateMatch },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.category",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$categoryDetails.name",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          sales: { $sum: "$items.quantity" }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ])

    // 5. Top Customers
    const topCustomers = await Order.aggregate([
      { $match: dateMatch },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $group: {
          _id: "$user",
          name: { $first: "$userDetails.name" },
          email: { $first: "$userDetails.email" },
          avatar: { $first: "$userDetails.image" },
          totalSpend: { $sum: "$grandTotal" },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 5 }
    ])

    const lowStock = await Product.find({ stock: { $lte: 5 } })
      .select("name brand stock price")
      .limit(10)

    return {
      success: true,
      data: {
        kpis: {
          totalRevenue: parseFloat(kpis.totalRevenue.toFixed(2)),
          totalSales: kpis.totalSales,
          ordersCount: kpis.ordersCount,
          deliveredOrders: kpis.deliveredOrders,
          cancelledOrders: kpis.cancelledOrders,
          pendingOrders: kpis.pendingOrders,
          avgOrderValue
        },
        salesTrend,
        bestSellers: JSON.parse(JSON.stringify(bestSellers)),
        topCategories: JSON.parse(JSON.stringify(topCategories)),
        topCustomers: JSON.parse(JSON.stringify(topCustomers)),
        lowStock: JSON.parse(JSON.stringify(lowStock))
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
