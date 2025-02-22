import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { username, password, signalKeys } = await request.json()

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 })
    }

    // Hasher le mot de passe
    const passwordHash = await hash(password, 12)

    // Créer l'utilisateur et ses clés dans une transaction
    const user = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const newUser = await tx.user.create({
        data: {
          username,
          passwordHash,
        },
      })

      // Stocker les clés Signal
      await tx.signalKeys.create({
        data: {
          userId: newUser.id,
          publicKey: signalKeys.identityKey.public,
          privateKey: signalKeys.identityKey.private,
        },
      })

      // Stocker la signed pre key
      await tx.signedPreKey.create({
        data: {
          userId: newUser.id,
          keyId: signalKeys.signedPreKey.keyId,
          publicKey: signalKeys.signedPreKey.publicKey,
          privateKey: signalKeys.signedPreKey.keyPair.privKey,
          signature: signalKeys.signedPreKey.signature,
        },
      })

      // Stocker les pre keys
      await tx.preKey.createMany({
        data: signalKeys.preKeys.map((preKey: any) => ({
          userId: newUser.id,
          keyId: preKey.keyId,
          publicKey: preKey.publicKey,
          privateKey: preKey.keyPair.privKey,
        })),
      })

      return newUser
    })

    // Retourner les informations de l'utilisateur (sans le mot de passe)
    return NextResponse.json({
      id: user.id,
      username: user.username,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}

