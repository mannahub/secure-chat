import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { prisma } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function getUserFromRequest(request: Request) {
  try {
    // Récupérer le token des cookies
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    // Vérifier le token
    const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: verified.payload.userId as string },
    })

    return user
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

