"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"
import { SocketService } from "@/lib/socket/socket-service"

interface SocketContextType {
  sendMessage: (recipientId: string, content: string) => Promise<any>
  onMessage: (handler: (message: any) => void) => void
  onUserStatus: (handler: (status: { userId: string; online: boolean }) => void) => void
}

const SocketContext = createContext<SocketContextType | null>(null)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, signalClient } = useAuth()
  const [socketService, setSocketService] = useState<SocketService | null>(null)

  useEffect(() => {
    if (!user || !signalClient) return

    const service = new SocketService(signalClient)
    service.connect(user.id)
    setSocketService(service)

    return () => {
      service.disconnect()
    }
  }, [user, signalClient])

  const value = {
    sendMessage: async (recipientId: string, content: string) => {
      if (!socketService) throw new Error("Socket service not initialized")
      return socketService.sendMessage(recipientId, content)
    },
    onMessage: (handler: (message: any) => void) => {
      if (!socketService) return
      socketService.onMessage(handler)
    },
    onUserStatus: (handler: (status: { userId: string; online: boolean }) => void) => {
      if (!socketService) return
      socketService.onUserStatus(handler)
    },
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

