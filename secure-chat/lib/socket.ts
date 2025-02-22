import { io, type Socket } from "socket.io-client"
import type { SignalClient } from "./signal/client"

export class SecureSocketService {
  private socket: Socket
  private signalClient: SignalClient
  private messageHandlers: ((message: any) => void)[] = []

  constructor(signalClient: SignalClient) {
    this.signalClient = signalClient
    this.socket = io("http://localhost:3000", {
      autoConnect: false,
    })

    this.setupSocketListeners()
  }

  private setupSocketListeners() {
    this.socket.on("receive_message", async (data) => {
      try {
        const { senderId, encryptedMessage } = data

        // Récupérer le bundle de clés si nécessaire
        const preKeyBundle = await this.fetchPreKeyBundle(senderId)

        // Créer une session si elle n'existe pas
        await this.signalClient.createSession(senderId, preKeyBundle)

        // Déchiffrer le message
        const decryptedMessage = await this.signalClient.decryptMessage(senderId, encryptedMessage)

        // Notifier les handlers
        this.messageHandlers.forEach((handler) =>
          handler({
            senderId,
            message: decryptedMessage,
            timestamp: new Date(),
          }),
        )
      } catch (error) {
        console.error("Error processing received message:", error)
      }
    })
  }

  private async fetchPreKeyBundle(userId: string) {
    const response = await fetch(`/api/users/${userId}/preKeyBundle`)
    if (!response.ok) {
      throw new Error("Failed to fetch preKeyBundle")
    }
    return response.json()
  }

  async connect(token: string) {
    this.socket.auth = { token }
    this.socket.connect()
  }

  async sendMessage(recipientId: string, message: string) {
    try {
      // Récupérer le bundle de clés si nécessaire
      const preKeyBundle = await this.fetchPreKeyBundle(recipientId)

      // Créer une session si elle n'existe pas
      await this.signalClient.createSession(recipientId, preKeyBundle)

      // Chiffrer le message
      const encryptedMessage = await this.signalClient.encryptMessage(recipientId, message)

      // Envoyer via socket
      this.socket.emit("send_message", {
        recipientId,
        encryptedMessage,
      })
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  onMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler)
  }

  disconnect() {
    this.socket.disconnect()
  }
}

