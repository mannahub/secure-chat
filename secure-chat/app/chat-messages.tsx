"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CryptoService } from "@/lib/crypto"
import { SecureWebSocket } from "@/lib/websocket"

interface Message {
  id: number
  sender: string
  avatar?: string
  message: string
  timestamp: string
  isSender: boolean
}

export default function ChatMessages() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [secureWs, setSecureWs] = useState<SecureWebSocket | null>(null)
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null)

  useEffect(() => {
    // Initialisation du chiffrement et de la connexion WebSocket
    async function initSecureChat() {
      try {
        // Génère une paire de clés pour l'utilisateur
        const newKeyPair = await CryptoService.generateKeyPair()
        setKeyPair(newKeyPair)

        // Initialise la connexion WebSocket sécurisée
        const ws = new SecureWebSocket("wss://your-server.com/chat")

        // Écoute les messages entrants
        ws.onMessage((decryptedMessage) => {
          const newMessage: Message = {
            id: Date.now(),
            sender: "Other User",
            message: decryptedMessage,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isSender: false,
          }
          setMessages((prev) => [...prev, newMessage])
        })

        setSecureWs(ws)

        // Simule la réception de la clé publique de l'autre utilisateur
        // Dans une vraie application, ceci serait fait via un échange sécurisé
        const otherPublicKey = await CryptoService.generateKeyPair().then((kp) => kp.publicKey)
        await ws.initSecureSession(newKeyPair.privateKey, otherPublicKey)
      } catch (error) {
        console.error("Error initializing secure chat:", error)
      }
    }

    initSecureChat()

    return () => {
      secureWs?.close()
    }
  }, [secureWs])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  // Fonction pour envoyer un message
  const sendMessage = async (text: string) => {
    if (!secureWs) return

    try {
      await secureWs.sendMessage(text)

      const newMessage: Message = {
        id: Date.now(),
        sender: "You",
        message: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSender: true,
      }

      setMessages((prev) => [...prev, newMessage])
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  return (
    <ScrollArea ref={scrollRef} className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.isSender ? "flex-row-reverse" : ""}`}>
            {!message.isSender && (
              <Avatar>
                <AvatarImage src={message.avatar} />
                <AvatarFallback>{message.sender[0]}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`rounded-lg p-3 max-w-[70%] ${
                message.isSender ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {!message.isSender && <div className="font-medium text-sm mb-1">{message.sender}</div>}
              <p className="text-sm">{message.message}</p>
              <div
                className={`text-xs mt-1 ${message.isSender ? "text-primary-foreground/70" : "text-muted-foreground"}`}
              >
                {message.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

