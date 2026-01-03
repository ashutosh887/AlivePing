import { Keypair, PublicKey } from '@solana/web3.js'
import * as SecureStore from 'expo-secure-store'

const WALLET_STORAGE_KEY = 'aliveping_wallet_secret'
const WALLET_TYPE_KEY = 'aliveping_wallet_type'
const PHANTOM_PUBLIC_KEY_KEY = 'aliveping_phantom_public_key'

export type WalletType = 'local' | 'phantom'

export interface WalletInfo {
  publicKey: string
  type: WalletType
  isConnected: boolean
}

const validateSecretKey = (secretKey: Uint8Array): boolean => {
  return secretKey.length === 64
}

const validatePublicKey = (publicKey: string): boolean => {
  try {
    new PublicKey(publicKey)
    return true
  } catch {
    return false
  }
}

export const getOrCreateWallet = async (): Promise<Keypair> => {
  try {
    const storedSecret = await SecureStore.getItemAsync(WALLET_STORAGE_KEY)
    
    if (storedSecret) {
      try {
        const parsedSecret = JSON.parse(storedSecret)
        
        if (!Array.isArray(parsedSecret)) {
          throw new Error('Invalid secret key format')
        }
        
        const secretKey = Uint8Array.from(parsedSecret)
        
        if (!validateSecretKey(secretKey)) {
          throw new Error('Invalid secret key length')
        }
        
        const keypair = Keypair.fromSecretKey(secretKey)
        
        if (!keypair.publicKey) {
          throw new Error('Invalid keypair: missing public key')
        }
        
        return keypair
      } catch (parseError) {
        console.error('Error parsing stored wallet:', parseError)
        await SecureStore.deleteItemAsync(WALLET_STORAGE_KEY)
        await SecureStore.deleteItemAsync(WALLET_TYPE_KEY)
      }
    }

    const newKeypair = Keypair.generate()
    
    if (!newKeypair.publicKey) {
      throw new Error('Failed to generate valid keypair')
    }
    
    const secretKeyArray = Array.from(newKeypair.secretKey)
    
    if (!validateSecretKey(newKeypair.secretKey)) {
      throw new Error('Generated keypair has invalid secret key length')
    }
    
    await SecureStore.setItemAsync(WALLET_STORAGE_KEY, JSON.stringify(secretKeyArray))
    await SecureStore.setItemAsync(WALLET_TYPE_KEY, 'local')
    
    return newKeypair
  } catch (error: any) {
    console.error('Error managing wallet:', error)
    
    if (error.message) {
      throw new Error(`Failed to get or create wallet: ${error.message}`)
    }
    throw new Error('Failed to get or create wallet. Please try again.')
  }
}

export const getWalletPublicKey = async (): Promise<string> => {
  try {
    const walletType = await SecureStore.getItemAsync(WALLET_TYPE_KEY)
    
    if (walletType === 'phantom') {
      const phantomPublicKey = await SecureStore.getItemAsync(PHANTOM_PUBLIC_KEY_KEY)
      if (phantomPublicKey && validatePublicKey(phantomPublicKey)) {
        return phantomPublicKey
      }
      console.warn('Invalid Phantom public key, falling back to local wallet')
      await SecureStore.deleteItemAsync(WALLET_TYPE_KEY)
      await SecureStore.deleteItemAsync(PHANTOM_PUBLIC_KEY_KEY)
    }
    
    const keypair = await getOrCreateWallet()
    return keypair.publicKey.toBase58()
  } catch (error: any) {
    console.error('Error getting wallet public key:', error)
    throw new Error(`Failed to get wallet address: ${error.message || 'Unknown error'}`)
  }
}

export const getWalletInfo = async (): Promise<WalletInfo | null> => {
  try {
    const walletType = (await SecureStore.getItemAsync(WALLET_TYPE_KEY)) as WalletType | null || 'local'
    const publicKey = await getWalletPublicKey()
    
    return {
      publicKey,
      type: walletType,
      isConnected: !!publicKey,
    }
  } catch (error) {
    console.error('Error getting wallet info:', error)
    return null
  }
}

export const setPhantomWallet = async (publicKey: string): Promise<void> => {
  try {
    if (!validatePublicKey(publicKey)) {
      throw new Error('Invalid Phantom public key')
    }
    
    await SecureStore.setItemAsync(PHANTOM_PUBLIC_KEY_KEY, publicKey)
    await SecureStore.setItemAsync(WALLET_TYPE_KEY, 'phantom')
  } catch (error: any) {
    console.error('Error setting Phantom wallet:', error)
    throw new Error(`Failed to set Phantom wallet: ${error.message || 'Unknown error'}`)
  }
}

export const clearWallet = async (): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(WALLET_STORAGE_KEY),
      SecureStore.deleteItemAsync(WALLET_TYPE_KEY),
      SecureStore.deleteItemAsync(PHANTOM_PUBLIC_KEY_KEY),
    ])
  } catch (error) {
    console.error('Error clearing wallet:', error)
    try {
      await SecureStore.deleteItemAsync(WALLET_STORAGE_KEY)
    } catch {}
    try {
      await SecureStore.deleteItemAsync(WALLET_TYPE_KEY)
    } catch {}
    try {
      await SecureStore.deleteItemAsync(PHANTOM_PUBLIC_KEY_KEY)
    } catch {}
  }
}

export const hasWallet = async (): Promise<boolean> => {
  try {
    const walletType = await SecureStore.getItemAsync(WALLET_TYPE_KEY)
    
    if (walletType === 'phantom') {
      const phantomKey = await SecureStore.getItemAsync(PHANTOM_PUBLIC_KEY_KEY)
      return !!phantomKey && validatePublicKey(phantomKey)
    }
    
    const localKey = await SecureStore.getItemAsync(WALLET_STORAGE_KEY)
    return !!localKey
  } catch {
    return false
  }
}

export const validateWallet = async (): Promise<boolean> => {
  try {
    const publicKey = await getWalletPublicKey()
    return validatePublicKey(publicKey)
  } catch {
    return false
  }
}

