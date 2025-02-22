"use client"

import { useState } from "react"
import { ContactList } from "@/components/contacts/contact-list"
import { ChatWindow } from "@/components/chat/chat-window"

interface Contact {
  id: string
  contact: {
    id: string
    username: string
  }
}

export default function ChatPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r">
        <ContactList onSelectContact={setSelectedContact} />
      </div>
      <div className="flex-1">
        {selectedContact ? (
          <ChatWindow contactId={selectedContact.contact.id} contactName={selectedContact.contact.username} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a contact to start chatting
          </div>
        )}
      </div>
    </div>
  )
}

