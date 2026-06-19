import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import clientPromise from "@/lib/mongodb"
import dbConnect from "@/lib/db"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour - auto logout for security
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-google-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-google-secret",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: profile.role || "customer",
          status: "active"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        await dbConnect()
        const user = await User.findOne({ email: credentials.email.toLowerCase() })
        if (!user) {
          throw new Error("No user found with this email")
        }

        if (user.status === "inactive") {
          throw new Error("Your account has been deactivated")
        }

        if (!user.password) {
          throw new Error("Please log in using Google sign-in")
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) {
          throw new Error("Incorrect password")
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image || "",
          role: user.role,
          status: user.status
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role || "customer"
        token.status = user.status || "active"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as "admin" | "customer"
        session.user.status = token.status as "active" | "inactive"
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  trustHost: true
})
