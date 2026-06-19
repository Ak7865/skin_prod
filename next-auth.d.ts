import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      role: "admin" | "customer"
      status: "active" | "inactive"
    }
  }

  interface User {
    role?: "admin" | "customer"
    status?: "active" | "inactive"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: "admin" | "customer"
    status?: "active" | "inactive"
  }
}
