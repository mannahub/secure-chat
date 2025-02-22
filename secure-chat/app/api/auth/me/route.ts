import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET() {
  try {
    const token = cookies().get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Vérifier le token
    const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: verified.payload.userId as string },
      include: {
        identityKey: true,
        signedPreKey: true,
        preKeys: {
          where: { used: false },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Retourner les informations de l'utilisateur
    return NextResponse.json({
      id: user.id,
      username: user.username,
      signalKeys: {
        identityKey: user.identityKey,
        signedPreKey: user.signedPreKey,
        preKey: user.preKeys[0],
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}

