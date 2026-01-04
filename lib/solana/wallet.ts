import { PublicKey } from '@solana/web3.js'
import { secureStoreGetItemAsync, secureStoreSetItemAsync, secureStoreDeleteItemAsync } from '@/lib/utils/secureStore'
import { getLocalWalletPublicKey, hasLocalWallet } from './localWallet'

const WALLET_TYPE_KEY = 'aliveping_wallet_type'
const WALLET_PUBLIC_KEY_KEY = 'aliveping_wallet_public_key'
const WALLET_AUTH_TOKEN_KEY = 'aliveping_wallet_auth_token'

export type WalletType = 'mobile_wallet_adapter' | 'local_keypair'

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
    const publicKey = await secureStoreGetItemAsync(WALLET_PUBLIC_KEY_KEY)
    
    if (publicKey && validatePublicKey(publicKey)) {
      return publicKey
    }
    
    return null
  } catch (error: any) {
    return null
  }
}

export const getWalletInfo = async (): Promise<WalletInfo | null> => {
  try {
    const walletType = (await secureStoreGetItemAsync(WALLET_TYPE_KEY)) as WalletType | null
    let publicKey = await getWalletPublicKey()
    
    if (!publicKey && walletType === 'local_keypair') {
      publicKey = await getLocalWalletPublicKey()
    }
    
    if (!walletType || !publicKey) {
      const hasLocal = await hasLocalWallet()
      if (hasLocal) {
        const localPubKey = await getLocalWalletPublicKey()
        if (localPubKey) {
          return {
            publicKey: localPubKey,
            type: 'local_keypair',
            isConnected: true,
          }
        }
      }
      return null
    }
    
    const authToken = walletType === 'mobile_wallet_adapter' 
      ? await secureStoreGetItemAsync(WALLET_AUTH_TOKEN_KEY)
      : null
    
    return {
      publicKey,
      type: walletType,
      isConnected: true,
      authToken: authToken || undefined,
    }
  } catch (error) {
    return null
  }
}

export const setWallet = async (publicKey: string, type: WalletType, authToken?: string): Promise<void> => {
  try {
    if (!validatePublicKey(publicKey)) {
      throw new Error(`Invalid wallet public key`)
    }
    
    await secureStoreSetItemAsync(WALLET_PUBLIC_KEY_KEY, publicKey)
    await secureStoreSetItemAsync(WALLET_TYPE_KEY, type)
    
    if (authToken) {
      await secureStoreSetItemAsync(WALLET_AUTH_TOKEN_KEY, authToken)
    } else if (type === 'local_keypair') {
      await secureStoreDeleteItemAsync(WALLET_AUTH_TOKEN_KEY)
    }
  } catch (error: any) {
    throw new Error(`Failed to set wallet: ${error.message || 'Unknown error'}`)
  }
}

export const clearWallet = async (): Promise<void> => {
  try {
    const { clearLocalWallet } = await import('./localWallet')
    await clearLocalWallet()
    
    await Promise.all([
      secureStoreDeleteItemAsync(WALLET_TYPE_KEY),
      secureStoreDeleteItemAsync(WALLET_PUBLIC_KEY_KEY),
      secureStoreDeleteItemAsync(WALLET_AUTH_TOKEN_KEY),
    ])
  } catch (error) {
    try {
      await secureStoreDeleteItemAsync(WALLET_TYPE_KEY)
    } catch {}
    try {
      await secureStoreDeleteItemAsync(WALLET_PUBLIC_KEY_KEY)
    } catch {}
    try {
      await secureStoreDeleteItemAsync(WALLET_AUTH_TOKEN_KEY)
    } catch {}
  }
}

export const hasWallet = async (): Promise<boolean> => {
  try {
    const walletType = await secureStoreGetItemAsync(WALLET_TYPE_KEY)
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
    return await secureStoreGetItemAsync(WALLET_AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}
