"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth/auth-service"
import type { SignalClient } from "@/lib/signal/client"

interface User {
  id: string
  username: string
}

interface AuthContextType {
  user: User | null
  signalClient: SignalClient | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [signalClient, setSignalClient] = useState<SignalClient | null>(null)
  const router = useRouter()
  const authService = AuthService.getInstance()

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          setSignalClient(authService.getSignalClient())
        } else {
          router.push("/") // Rediriger vers la page de login
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/")
      }
    }

    checkAuth()
  }, [router, authService])

  const login = async (username: string, password: string) => {
    const userData = await authService.login(username, password)
    setUser(userData)
    setSignalClient(authService.getSignalClient())
    router.push("/chat")
  }

  const register = async (username: string, password: string) => {
    const userData = await authService.register(username, password)
    setUser(userData)
    setSignalClient(authService.getSignalClient())
    router.push("/chat")
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    setSignalClient(null)
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, signalClient, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

