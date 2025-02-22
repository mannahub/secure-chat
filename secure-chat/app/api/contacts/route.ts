import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Récupérer les contacts de l'utilisateur
    const contacts = await prisma.contact.findMany({
      where: { userId: user.id },
      include: {
        contact: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Get contacts error:", error)
    return NextResponse.json({ error: "Failed to get contacts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { username } = await request.json()

    // Trouver l'utilisateur à ajouter
    const contactUser = await prisma.user.findUnique({
      where: { username },
    })

    if (!contactUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Vérifier si le contact existe déjà
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId: user.id,
        contactId: contactUser.id,
      },
    })

    if (existingContact) {
      return NextResponse.json({ error: "Contact already exists" }, { status: 400 })
    }

    // Créer le contact
    const contact = await prisma.contact.create({
      data: {
        userId: user.id,
        contactId: contactUser.id,
      },
      include: {
        contact: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error("Add contact error:", error)
    return NextResponse.json({ error: "Failed to add contact" }, { status: 500 })
  }
}

