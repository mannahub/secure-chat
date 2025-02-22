import {
  KeyHelper,
  SessionBuilder,
  SessionCipher,
  type PreKeyBundle,
  SignalProtocolAddress,
} from "@privacyresearch/libsignal-protocol-typescript"
import { SignalProtocolStore } from "./store"

export class SignalClient {
  private store: SignalProtocolStore
  private userId: string

  constructor(userId: string) {
    this.store = new SignalProtocolStore()
    this.userId = userId
  }

  // Initialise le client Signal avec de nouvelles clés
  async initialize() {
    // Génère une paire de clés d'identité
    const identityKeyPair = await KeyHelper.generateIdentityKeyPair()

    // Génère un ID d'enregistrement
    const registrationId = KeyHelper.generateRegistrationId()

    // Initialise le store avec les clés générées
    await this.store.initialize(identityKeyPair, registrationId)

    // Génère les pre-keys initiales
    const preKeys = await this.generatePreKeys(1, 10) // Génère 10 pre-keys
    const signedPreKey = await this.generateSignedPreKey(identityKeyPair, 1)

    return {
      identityKey: identityKeyPair.pubKey,
      registrationId,
      preKeys,
      signedPreKey,
    }
  }

  // Génère un lot de pre-keys
  private async generatePreKeys(startId: number, count: number) {
    const preKeys = []
    for (let i = startId; i < startId + count; i++) {
      const preKey = await KeyHelper.generatePreKey(i)
      await this.store.storePreKey(i, preKey.keyPair)
      preKeys.push({
        keyId: i,
        publicKey: preKey.keyPair.pubKey,
      })
    }
    return preKeys
  }

  // Génère une pre-key signée
  private async generateSignedPreKey(identityKeyPair: any, signedPreKeyId: number) {
    const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, signedPreKeyId)

    return {
      keyId: signedPreKeyId,
      publicKey: signedPreKey.keyPair.pubKey,
      signature: signedPreKey.signature,
    }
  }

  // Établit une session avec un autre utilisateur
  async createSession(theirUserId: string, preKeyBundle: PreKeyBundle) {
    const address = new SignalProtocolAddress(theirUserId, 1)
    const sessionBuilder = new SessionBuilder(this.store, address)
    await sessionBuilder.processPreKeyBundle(preKeyBundle)
  }

  // Chiffre un message pour un destinataire
  async encryptMessage(recipientId: string, message: string): Promise<ArrayBuffer> {
    const address = new SignalProtocolAddress(recipientId, 1)
    const sessionCipher = new SessionCipher(this.store, address)

    const encodedMessage = new TextEncoder().encode(message)
    return await sessionCipher.encrypt(encodedMessage)
  }

  // Déchiffre un message reçu
  async decryptMessage(senderId: string, encryptedMessage: ArrayBuffer): Promise<string> {
    const address = new SignalProtocolAddress(senderId, 1)
    const sessionCipher = new SessionCipher(this.store, address)

    const decryptedMessage = await sessionCipher.decrypt(encryptedMessage)
    return new TextDecoder().decode(decryptedMessage)
  }
}

