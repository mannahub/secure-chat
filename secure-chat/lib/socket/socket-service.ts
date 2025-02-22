import { io, type Socket } from "socket.io-client"
import type { SignalClient } from "../signal/client"

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  timestamp: Date
}

export class SocketService {
  private socket: Socket | null = null
  private messageHandlers: ((message: Message) => void)[] = []
  private statusHandlers: ((status: { userId: string; online: boolean }) => void)[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(private signalClient: SignalClient) {}

  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    })

    this.setupSocketListeners()
  }

  private setupSocketListeners() {
    if (!this.socket) return

    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server")
      this.reconnectAttempts = 0
    })

    this.socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server")
    })

    this.socket.on("reconnect_attempt", (attempt) => {
      console.log(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`)
    })

    this.socket.on("reconnect_failed", () => {
      console.error("Failed to reconnect to WebSocket server")
    })

    this.socket.on(
      "receive_message",
      async (data: {
        senderId: string
        encryptedContent: ArrayBuffer
      }) => {
        try {
          // Déchiffrer le message avec le client Signal
          const decryptedContent = await this.signalClient.decryptMessage(data.senderId, data.encryptedContent)

          const message: Message = {
            id: crypto.randomUUID(),
            content: decryptedContent,
            senderId: data.senderId,
            receiverId: this.signalClient.getUserId(),
            timestamp: new Date(),
          }

          this.messageHandlers.forEach((handler) => handler(message))
        } catch (error) {
          console.error("Error processing received message:", error)
        }
      },
    )

    this.socket.on("user_status", (data: { userId: string; online: boolean }) => {
      this.statusHandlers.forEach((handler) => handler(data))
    })
  }

  async sendMessage(recipientId: string, content: string) {
    if (!this.socket?.connected) {
      throw new Error("Not connected to WebSocket server")
    }

    try {
      // Chiffrer le message avec le client Signal
      const encryptedContent = await this.signalClient.encryptMessage(recipientId, content)

      this.socket.emit("send_message", {
        recipientId,
        encryptedContent,
      })

      // Retourner le message pour l'affichage immédiat
      return {
        id: crypto.randomUUID(),
        content,
        senderId: this.signalClient.getUserId(),
        receiverId: recipientId,
        timestamp: new Date(),
      }
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  onMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler)
  }

  onUserStatus(handler: (status: { userId: string; online: boolean }) => void) {
    this.statusHandlers.push(handler)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

