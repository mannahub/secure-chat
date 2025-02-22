import type { Direction } from "@privacyresearch/libsignal-protocol-typescript"

// Interface pour le stockage des sessions Signal
export interface SignalStore {
  getIdentityKeyPair(): Promise<{ pubKey: ArrayBuffer; privKey: ArrayBuffer }>
  getLocalRegistrationId(): Promise<number>
  saveIdentity(identifier: string, publicKey: ArrayBuffer): Promise<boolean>
  isTrustedIdentity(identifier: string, publicKey: ArrayBuffer, direction: Direction): Promise<boolean>
  loadPreKey(keyId: number): Promise<{ pubKey: ArrayBuffer; privKey: ArrayBuffer }>
  storePreKey(keyId: number, keyPair: { pubKey: ArrayBuffer; privKey: ArrayBuffer }): Promise<void>
  removePreKey(keyId: number): Promise<void>
  loadSession(identifier: string): Promise<any>
  storeSession(identifier: string, session: any): Promise<void>
}

// Implémentation du stockage en mémoire (à remplacer par IndexedDB en production)
export class SignalProtocolStore implements SignalStore {
  private identityKeyPair: { pubKey: ArrayBuffer; privKey: ArrayBuffer } | null = null
  private registrationId: number | null = null
  private preKeys: Map<number, { pubKey: ArrayBuffer; privKey: ArrayBuffer }> = new Map()
  private sessions: Map<string, any> = new Map()
  private identities: Map<string, ArrayBuffer> = new Map()

  async getIdentityKeyPair() {
    if (!this.identityKeyPair) {
      throw new Error("Identity key pair not set")
    }
    return this.identityKeyPair
  }

  async getLocalRegistrationId() {
    if (!this.registrationId) {
      throw new Error("Registration ID not set")
    }
    return this.registrationId
  }

  async saveIdentity(identifier: string, publicKey: ArrayBuffer) {
    const existing = this.identities.get(identifier)
    this.identities.set(identifier, publicKey)
    return !existing || !this.areArrayBuffersEqual(existing, publicKey)
  }

  async isTrustedIdentity(identifier: string, publicKey: ArrayBuffer, direction: Direction) {
    const existing = this.identities.get(identifier)
    if (!existing) {
      return true
    }
    return this.areArrayBuffersEqual(existing, publicKey)
  }

  async loadPreKey(keyId: number) {
    const preKey = this.preKeys.get(keyId)
    if (!preKey) {
      throw new Error(`Pre key ${keyId} not found`)
    }
    return preKey
  }

  async storePreKey(keyId: number, keyPair: { pubKey: ArrayBuffer; privKey: ArrayBuffer }) {
    this.preKeys.set(keyId, keyPair)
  }

  async removePreKey(keyId: number) {
    this.preKeys.delete(keyId)
  }

  async loadSession(identifier: string) {
    return this.sessions.get(identifier)
  }

  async storeSession(identifier: string, session: any) {
    this.sessions.set(identifier, session)
  }

  // Méthodes d'initialisation
  async initialize(identityKeyPair: { pubKey: ArrayBuffer; privKey: ArrayBuffer }, registrationId: number) {
    this.identityKeyPair = identityKeyPair
    this.registrationId = registrationId
  }

  private areArrayBuffersEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
    if (a.byteLength !== b.byteLength) return false
    const a8 = new Uint8Array(a)
    const b8 = new Uint8Array(b)
    return a8.every((val, i) => val === b8[i])
  }
}

