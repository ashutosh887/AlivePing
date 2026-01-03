import { Keypair } from '@solana/web3.js'
import * as SecureStore from 'expo-secure-store'

const WALLET_STORAGE_KEY = 'aliveping_wallet_secret'

export const getOrCreateWallet = async (): Promise<Keypair> => {
  try {
    const storedSecret = await SecureStore.getItemAsync(WALLET_STORAGE_KEY)
    
    if (storedSecret) {
      const secretKey = Uint8Array.from(JSON.parse(storedSecret))
      return Keypair.fromSecretKey(secretKey)
    }

    const newKeypair = Keypair.generate()
    const secretKeyArray = Array.from(newKeypair.secretKey)
    await SecureStore.setItemAsync(WALLET_STORAGE_KEY, JSON.stringify(secretKeyArray))
    
    return newKeypair
  } catch (error) {
    console.error('Error managing wallet:', error)
    throw new Error('Failed to get or create wallet')
  }
}

export const getWalletPublicKey = async (): Promise<string> => {
  const keypair = await getOrCreateWallet()
  return keypair.publicKey.toBase58()
}

export const clearWallet = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(WALLET_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing wallet:', error)
  }
}

