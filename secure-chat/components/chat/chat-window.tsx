"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: {
    username: string
  }
}

interface ChatWindowProps {
  contactId: string
  contactName: string
}

export function ChatWindow({ contactId, contactName }: ChatWindowProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const socket = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetchMessages()
    initializeWebSocket()

    return () => {
      if (socket.current) {
        socket.current.close()
      }
    }
  }, [contactId])

  useEffect(() => {
    scrollToBottom()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?contactId=${contactId}`)
      if (!response.ok) throw new Error("Failed to fetch messages")
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const initializeWebSocket = () => {
    socket.current = new WebSocket(`${window.location.origin}/api/socket`)

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "message" && (data.senderId === contactId || data.receiverId === contactId)) {
        setMessages((prev) => [...prev, data.message])
      }
    }
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          receiverId: contactId,
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      const message = await response.json()
      setMessages((prev) => [...prev, message])
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  if (loading) {
    return <div className="p-4">Loading messages...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>{contactName[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{contactName}</h2>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${message.senderId === user?.id ? "flex-row-reverse" : ""}`}
            >
              <Avatar>
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>{message.sender.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div
                className={`rounded-lg p-3 max-w-[70%] ${
                  message.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div
                  className={`text-xs mt-1 ${
                    message.senderId === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  )
}

