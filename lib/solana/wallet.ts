import { PublicKey } from '@solana/web3.js'
import * as SecureStore from 'expo-secure-store'

const WALLET_TYPE_KEY = 'aliveping_wallet_type'
const WALLET_PUBLIC_KEY_KEY = 'aliveping_wallet_public_key'
const WALLET_AUTH_TOKEN_KEY = 'aliveping_wallet_auth_token'

export type WalletType = 'mobile_wallet_adapter'

export interface WalletInfo {
  publicKey: string
  type: WalletType
  isConnected: boolean
  authToken?: string
}

const validatePublicKey = (publicKey: string): boolean => {
  try {
    new PublicKey(publicKey)
    return true
  } catch {
    return false
  }
}

export const getWalletPublicKey = async (): Promise<string | null> => {
  try {
    const publicKey = await SecureStore.getItemAsync(WALLET_PUBLIC_KEY_KEY)
    
    if (publicKey && validatePublicKey(publicKey)) {
      return publicKey
    }
    
    return null
  } catch (error: any) {
    console.error('Error getting wallet public key:', error)
    return null
  }
}

export const getWalletInfo = async (): Promise<WalletInfo | null> => {
  try {
    const walletType = (await SecureStore.getItemAsync(WALLET_TYPE_KEY)) as WalletType | null
    const publicKey = await getWalletPublicKey()
    const authToken = await SecureStore.getItemAsync(WALLET_AUTH_TOKEN_KEY)
    
    if (!walletType || !publicKey) {
      return null
    }
    
    return {
      publicKey,
      type: walletType,
      isConnected: true,
      authToken: authToken || undefined,
    }
  } catch (error) {
    console.error('Error getting wallet info:', error)
    return null
  }
}

export const setWallet = async (publicKey: string, type: WalletType, authToken?: string): Promise<void> => {
  try {
    if (!validatePublicKey(publicKey)) {
      throw new Error(`Invalid wallet public key`)
    }
    
    await SecureStore.setItemAsync(WALLET_PUBLIC_KEY_KEY, publicKey)
    await SecureStore.setItemAsync(WALLET_TYPE_KEY, type)
    
    if (authToken) {
      await SecureStore.setItemAsync(WALLET_AUTH_TOKEN_KEY, authToken)
    }
  } catch (error: any) {
    console.error(`Error setting wallet:`, error)
    throw new Error(`Failed to set wallet: ${error.message || 'Unknown error'}`)
  }
}

export const clearWallet = async (): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(WALLET_TYPE_KEY),
      SecureStore.deleteItemAsync(WALLET_PUBLIC_KEY_KEY),
      SecureStore.deleteItemAsync(WALLET_AUTH_TOKEN_KEY),
    ])
  } catch (error) {
    console.error('Error clearing wallet:', error)
    try {
      await SecureStore.deleteItemAsync(WALLET_TYPE_KEY)
    } catch {}
    try {
      await SecureStore.deleteItemAsync(WALLET_PUBLIC_KEY_KEY)
    } catch {}
    try {
      await SecureStore.deleteItemAsync(WALLET_AUTH_TOKEN_KEY)
    } catch {}
  }
}

export const hasWallet = async (): Promise<boolean> => {
  try {
    const walletType = await SecureStore.getItemAsync(WALLET_TYPE_KEY)
    const publicKey = await getWalletPublicKey()
    
    return !!walletType && !!publicKey && validatePublicKey(publicKey)
  } catch {
    return false
  }
}

export const validateWallet = async (): Promise<boolean> => {
  try {
    const publicKey = await getWalletPublicKey()
    return publicKey !== null && validatePublicKey(publicKey)
  } catch {
    return false
  }
}

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(WALLET_AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}
