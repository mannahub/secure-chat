import { KeyHelper } from "@privacyresearch/libsignal-protocol-typescript"

export async function initializeSignalProtocol(userId: string) {
  // Générer la paire de clés d'identité
  const identityKeyPair = await KeyHelper.generateIdentityKeyPair()

  // Générer l'ID d'enregistrement
  const registrationId = KeyHelper.generateRegistrationId()

  // Générer les pre-keys
  const preKeys = []
  const startId = 1
  const preKeyCount = 100 // Nombre de pre-keys à générer

  for (let i = startId; i < startId + preKeyCount; i++) {
    const preKey = await KeyHelper.generatePreKey(i)
    preKeys.push({
      keyId: preKey.keyId,
      keyPair: preKey.keyPair,
    })
  }

  // Générer la signed pre-key
  const signedPreKeyId = 1
  const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, signedPreKeyId)

  return {
    identityKey: {
      public: identityKeyPair.pubKey,
      private: identityKeyPair.privKey,
    },
    registrationId,
    preKeys,
    signedPreKey: {
      keyId: signedPreKeyId,
      keyPair: signedPreKey.keyPair,
      signature: signedPreKey.signature,
    },
  }
}

