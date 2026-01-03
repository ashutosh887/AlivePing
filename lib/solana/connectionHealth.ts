import { Connection, PublicKey } from '@solana/web3.js'
import { getConnection } from './connection'
import { getWalletPublicKey, validateWallet } from './wallet'

export interface ConnectionHealth {
  isHealthy: boolean
  walletValid: boolean
  connectionValid: boolean
  publicKey: string | null
  errors: string[]
}

export const checkConnectionHealth = async (): Promise<ConnectionHealth> => {
  const health: ConnectionHealth = {
    isHealthy: false,
    walletValid: false,
    connectionValid: false,
    publicKey: null,
    errors: [],
  }

  try {
    try {
      const isValid = await validateWallet()
      health.walletValid = isValid

      if (isValid) {
        const publicKey = await getWalletPublicKey()
        health.publicKey = publicKey

        try {
          new PublicKey(publicKey)
        } catch {
          health.errors.push('Invalid public key format')
          health.walletValid = false
        }
      } else {
        health.errors.push('Wallet validation failed')
      }
    } catch (error: any) {
      health.errors.push(`Wallet check failed: ${error.message || 'Unknown error'}`)
    }

    try {
      const connection = getConnection()
      const blockhash = await connection.getLatestBlockhash('confirmed')
      
      if (blockhash && blockhash.blockhash) {
        health.connectionValid = true
      } else {
        health.errors.push('Failed to get latest blockhash')
      }
    } catch (error: any) {
      health.errors.push(`Connection check failed: ${error.message || 'Unknown error'}`)
    }

    health.isHealthy = health.walletValid && health.connectionValid

    return health
  } catch (error: any) {
    health.errors.push(`Health check failed: ${error.message || 'Unknown error'}`)
    return health
  }
}

export const validateWalletOperations = async (): Promise<boolean> => {
  try {
    const health = await checkConnectionHealth()
    return health.isHealthy
  } catch {
    return false
  }
}

export const getWalletBalance = async (): Promise<number> => {
  try {
    const connection = getConnection()
    const publicKeyStr = await getWalletPublicKey()
    const publicKey = new PublicKey(publicKeyStr)
    
    const balance = await connection.getBalance(publicKey)
    return balance / 1e9
  } catch (error: any) {
    console.error('Error getting wallet balance:', error)
    throw new Error(`Failed to get wallet balance: ${error.message || 'Unknown error'}`)
  }
}

