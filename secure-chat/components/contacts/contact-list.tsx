"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus } from "lucide-react"
import { AddContactDialog } from "./add-contact-dialog"

interface Contact {
  id: string
  contact: {
    id: string
    username: string
    isOnline?: boolean
  }
}

export function ContactList({ onSelectContact }: { onSelectContact: (contact: Contact) => void }) {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAddContact, setShowAddContact] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts")
      if (!response.ok) throw new Error("Failed to fetch contacts")
      const data = await response.json()
      setContacts(data)
    } catch (err) {
      setError("Could not load contacts")
    } finally {
      setLoading(false)
    }
  }

  const handleContactSelect = (contact: Contact) => {
    setSelectedContactId(contact.contact.id)
    onSelectContact(contact)
  }

  const handleAddContact = async (username: string) => {
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })

      if (!response.ok) throw new Error("Failed to add contact")

      const newContact = await response.json()
      setContacts((prev) => [...prev, newContact])
      setShowAddContact(false)
    } catch (err) {
      setError("Failed to add contact")
    }
  }

  if (loading) {
    return <div className="p-4">Loading contacts...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Contacts</h2>
        <Button variant="ghost" size="icon" onClick={() => setShowAddContact(true)}>
          <UserPlus className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => handleContactSelect(contact)}
              className={`w-full hover:bg-muted p-3 rounded-lg flex items-center gap-3 ${
                selectedContactId === contact.contact.id ? "bg-muted" : ""
              }`}
            >
              <Avatar>
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>{contact.contact.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="font-medium">{contact.contact.username}</div>
                <div className="text-xs text-muted-foreground">{contact.contact.isOnline ? "Online" : "Offline"}</div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      <AddContactDialog open={showAddContact} onOpenChange={setShowAddContact} onAdd={handleAddContact} />
    </div>
  )
}

