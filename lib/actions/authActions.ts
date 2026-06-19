"use server"

import dbConnect from "@/lib/db"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { auth } from "@/auth"

const SignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
})

export async function signUpUser(formData: FormData) {
  try {
    await dbConnect()
    
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const validated = SignUpSchema.safeParse({ name, email, password })
    if (!validated.success) {
      return { error: validated.error.errors[0].message }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return { error: "A user with this email already exists" }
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "customer"
    })

    await newUser.save()
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Something went wrong during signup" }
  }
}

const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  image: z.string().optional()
})

export async function updateProfile(formData: FormData) {
  try {
    const session = await auth()
    if (!session || !session.user?.email) {
      return { error: "Not authorized" }
    }

    await dbConnect()
    const name = formData.get("name") as string
    const image = formData.get("image") as string

    const validated = ProfileSchema.safeParse({ name, image })
    if (!validated.success) {
      return { error: validated.error.errors[0].message }
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return { error: "User not found" }
    }

    user.name = name
    if (image) {
      user.image = image
    }
    await user.save()

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to update profile" }
  }
}

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters")
})

export async function changePassword(formData: FormData) {
  try {
    const session = await auth()
    if (!session || !session.user?.email) {
      return { error: "Not authorized" }
    }

    await dbConnect()
    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string

    const validated = PasswordChangeSchema.safeParse({ currentPassword, newPassword })
    if (!validated.success) {
      return { error: validated.error.errors[0].message }
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return { error: "User not found" }
    }

    if (!user.password) {
      return { error: "OAuth accounts do not have passwords. Please log in with Google." }
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return { error: "Current password is incorrect" }
    }

    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to change password" }
  }
}
