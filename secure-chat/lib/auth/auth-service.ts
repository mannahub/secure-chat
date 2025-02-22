import { SignalClient } from "../signal/client"

interface User {
  id: string
  username: string
  preKeyBundle: any
}

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null
  private signalClient: SignalClient | null = null

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(username: string, password: string): Promise<User> {
    try {
      // Appel à l'API d'authentification
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error("Authentication failed")
      }

      const userData = await response.json()

      // Initialise le client Signal
      this.signalClient = new SignalClient(userData.id)
      await this.signalClient.initialize()

      this.currentUser = userData
      return userData
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  async register(username: string, password: string): Promise<User> {
    try {
      // Crée et initialise le client Signal
      const signalClient = new SignalClient(username)
      const keyBundle = await signalClient.initialize()

      // Appel à l'API d'inscription
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          keyBundle,
        }),
      })

      if (!response.ok) {
        throw new Error("Registration failed")
      }

      const userData = await response.json()
      this.currentUser = userData
      this.signalClient = signalClient

      return userData
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  getSignalClient(): SignalClient {
    if (!this.signalClient) {
      throw new Error("Signal client not initialized")
    }
    return this.signalClient
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  async logout(): Promise<void> {
    this.currentUser = null
    this.signalClient = null
    // Appel à l'API de déconnexion si nécessaire
  }
}

