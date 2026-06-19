import { NextResponse } from "next/server"
import { auth } from "@/auth"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || ""
})

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { amount, currency = "INR" } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: `receipt_${session.user.id}_${Date.now()}`
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create order"
    console.error("Razorpay Create Order Error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
