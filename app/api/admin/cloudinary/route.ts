import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "mock-cloud-name",
  api_key: process.env.CLOUDINARY_API_KEY || "mock-api-key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "mock-api-secret"
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    // @ts-ignore
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const fileUri = `data:${file.type};base64,${buffer.toString("base64")}`
    
    const uploadResponse = await cloudinary.uploader.upload(fileUri, {
      folder: "skin-care-products",
      resource_type: "auto"
    })

    return NextResponse.json({
      public_id: uploadResponse.public_id,
      secure_url: uploadResponse.secure_url,
      width: uploadResponse.width,
      height: uploadResponse.height
    })
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    // @ts-ignore
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 })
    }

    const { public_id } = await req.json()
    if (!public_id) {
      return NextResponse.json({ error: "Public ID is required" }, { status: 400 })
    }

    const deletionResponse = await cloudinary.uploader.destroy(public_id)
    return NextResponse.json({ success: true, result: deletionResponse })
  } catch (error: any) {
    console.error("Cloudinary Delete Error:", error)
    return NextResponse.json({ error: error.message || "Deletion failed" }, { status: 500 })
  }
}
