import { NextResponse } from "next/server"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/db"
import { SignJWT } from "jose"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Récupérer l'utilisateur avec ses clés
    const user = await prisma.user.findUnique({
      where: { username },
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
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Vérifier le mot de passe
    const isValid = await compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Créer le token JWT
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(JWT_SECRET))

    // Définir le cookie
    cookies().set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 heures
    })

    // Retourner les informations de l'utilisateur et ses clés
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
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}

