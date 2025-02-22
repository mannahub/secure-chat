// Utilitaires de chiffrement
export class CryptoService {
  private static readonly ALGORITHM = "AES-GCM"
  private static readonly KEY_ALGORITHM = "ECDH"
  private static readonly CURVE = "P-256"

  // Génère une paire de clés pour un utilisateur
  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      {
        name: this.KEY_ALGORITHM,
        namedCurve: this.CURVE,
      },
      true, // extractable
      ["deriveKey"], // usage
    )
  }

  // Dérive une clé partagée à partir d'une clé privée et d'une clé publique
  static async deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
    return await window.crypto.subtle.deriveKey(
      {
        name: this.KEY_ALGORITHM,
        public: publicKey,
      },
      privateKey,
      {
        name: this.ALGORITHM,
        length: 256,
      },
      false, // not extractable
      ["encrypt", "decrypt"],
    )
  }

  // Chiffre un message
  static async encryptMessage(key: CryptoKey, message: string): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
    const encoder = new TextEncoder()
    const encodedMessage = encoder.encode(message)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv,
      },
      key,
      encodedMessage,
    )

    return { ciphertext, iv }
  }

  // Déchiffre un message
  static async decryptMessage(key: CryptoKey, ciphertext: ArrayBuffer, iv: Uint8Array): Promise<string> {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv,
      },
      key,
      ciphertext,
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  // Exporte une clé publique pour le partage
  static async exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("spki", key)
    return btoa(String.fromCharCode(...new Uint8Array(exported)))
  }

  // Importe une clé publique partagée
  static async importPublicKey(keyStr: string): Promise<CryptoKey> {
    const keyData = Uint8Array.from(atob(keyStr), (c) => c.charCodeAt(0))
    return await window.crypto.subtle.importKey(
      "spki",
      keyData,
      {
        name: this.KEY_ALGORITHM,
        namedCurve: this.CURVE,
      },
      true,
      [],
    )
  }
}

