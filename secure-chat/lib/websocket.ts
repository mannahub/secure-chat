import { CryptoService } from "./crypto"

export class SecureWebSocket {
  private ws: WebSocket
  private sharedKey: CryptoKey | null = null
  private messageCallbacks: ((message: string) => void)[] = []

  constructor(url: string) {
    this.ws = new WebSocket(url)
    this.setupWebSocket()
  }

  private setupWebSocket() {
    this.ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "encrypted_message" && this.sharedKey) {
          const decrypted = await CryptoService.decryptMessage(this.sharedKey, data.ciphertext, new Uint8Array(data.iv))
          this.messageCallbacks.forEach((callback) => callback(decrypted))
        }
      } catch (error) {
        console.error("Error processing message:", error)
      }
    }
  }

  // Initialise une session chiffrée avec un autre utilisateur
  async initSecureSession(myPrivateKey: CryptoKey, theirPublicKey: CryptoKey) {
    this.sharedKey = await CryptoService.deriveSharedKey(myPrivateKey, theirPublicKey)
  }

  // Envoie un message chiffré
  async sendMessage(message: string) {
    if (!this.sharedKey) {
      throw new Error("Secure session not initialized")
    }

    const { ciphertext, iv } = await CryptoService.encryptMessage(this.sharedKey, message)

    this.ws.send(
      JSON.stringify({
        type: "encrypted_message",
        ciphertext: ciphertext,
        iv: Array.from(iv),
      }),
    )
  }

  // S'abonne aux messages entrants
  onMessage(callback: (message: string) => void) {
    this.messageCallbacks.push(callback)
  }

  // Ferme la connexion
  close() {
    this.ws.close()
  }
}

