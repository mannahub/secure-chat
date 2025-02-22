import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function middleware(request: NextRequest) {
  // Liste des routes protégées
  const protectedPaths = ["/chat", "/api/messages", "/api/contacts"]

  // Vérifier si le chemin est protégé
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    try {
      // Vérifier le token
      await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))

      return NextResponse.next()
    } catch (error) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/chat/:path*", "/api/:path*"],
}

