import configs from '@/config'
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { Platform } from 'react-native'
import { getAuthToken, setWallet } from './wallet'

const isWeb = Platform.OS === 'web'

export interface AuthorizationResult {
  publicKey: PublicKey
  authToken: string
  walletName?: string
}

export const connectWallet = async (): Promise<AuthorizationResult> => {
  if (isWeb) {
    throw new Error('Mobile wallet adapter is not available on web. Please use local wallet instead.')
  }
  
  try {
    return await new Promise<AuthorizationResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Wallet connection timed out. Please ensure you have a Solana wallet installed and try again.'))
      }, 30000)

      try {
        transact(async (wallet: any) => {
          try {
            clearTimeout(timeout)
            const authorizationResult = await wallet.authorize({
              cluster: process.env.EXPO_PUBLIC_SOLANA_NETWORK === 'mainnet' ? 'mainnet-beta' : 'devnet',
              appIdentity: {
                name: configs.appName,
                uri: configs.appUrl || 'https://aliveping.app',
                icon: configs.appIcon || 'https://aliveping.app/icon.png',
              },
            })

            const publicKey = new PublicKey(authorizationResult.publicKey)
            const authToken = authorizationResult.authToken

            await setWallet(publicKey.toBase58(), 'mobile_wallet_adapter', authToken)

            resolve({
              publicKey,
              authToken,
              walletName: authorizationResult.wallet?.name,
            })
          } catch (error: any) {
            clearTimeout(timeout)
            const errorMessage = error?.message || ''
            if (errorMessage.includes('secure context') || errorMessage.includes('https') || errorMessage.includes('SolanaMobileWalletAdapterError')) {
              reject(new Error('Wallet connection requires a secure context (HTTPS). This feature is not available in Expo Go. Please use a development build: https://docs.expo.dev/develop/development-builds/introduction/'))
            } else {
              reject(error)
            }
          }
        })
      } catch (error: any) {
        clearTimeout(timeout)
        const errorMessage = error?.message || ''
        if (errorMessage.includes('secure context') || errorMessage.includes('https') || errorMessage.includes('SolanaMobileWalletAdapterError')) {
          reject(new Error('Wallet connection requires a secure context (HTTPS). This feature is not available in Expo Go. Please use a development build: https://docs.expo.dev/develop/development-builds/introduction/'))
        } else {
          reject(error)
        }
      }
    })
  } catch (error: any) {
    const errorMessage = error?.message || ''
    if (errorMessage.includes('secure context') || errorMessage.includes('https') || errorMessage.includes('SolanaMobileWalletAdapterError')) {
      throw new Error('Wallet connection requires a secure context (HTTPS). This feature is not available in Expo Go. Please use a development build: https://docs.expo.dev/develop/development-builds/introduction/')
    }
    throw error
  }
}

export const signTransaction = async (
  transaction: Transaction | VersionedTransaction
): Promise<Transaction | VersionedTransaction> => {
  if (isWeb) {
    throw new Error('Mobile wallet adapter is not available on web.')
  }
  
  const authToken = await getAuthToken()
  
  if (!authToken) {
    throw new Error('No wallet connected. Please connect your wallet first.')
  }

  return new Promise((resolve, reject) => {
    try {
      transact(async (wallet: any) => {
        try {
          if (transaction instanceof Transaction) {
            const signed = await wallet.signTransactions({
              transactions: [transaction],
              authToken,
            })
            resolve(signed[0])
          } else {
            const signed = await wallet.signTransactions({
              transactions: [transaction],
              authToken,
            })
            resolve(signed[0])
          }
        } catch (error: any) {
          reject(error)
        }
      })
    } catch (error: any) {
      reject(error)
    }
  })
}

export const signAllTransactions = async (
  transactions: (Transaction | VersionedTransaction)[]
): Promise<(Transaction | VersionedTransaction)[]> => {
  if (isWeb) {
    throw new Error('Mobile wallet adapter is not available on web.')
  }
  
  const authToken = await getAuthToken()
  
  if (!authToken) {
    throw new Error('No wallet connected. Please connect your wallet first.')
  }

  return new Promise((resolve, reject) => {
    try {
      transact(async (wallet: any) => {
        try {
          const signed = await wallet.signTransactions({
            transactions,
            authToken,
          })
          resolve(signed)
        } catch (error: any) {
          reject(error)
        }
      })
    } catch (error: any) {
      reject(error)
    }
  })
}

export const disconnectWallet = async (): Promise<void> => {
  if (isWeb) {
    return
  }
  
  const authToken = await getAuthToken()
  
  if (!authToken) {
    return
  }

  return new Promise((resolve, reject) => {
    try {
      transact(async (wallet: any) => {
        try {
          await wallet.deauthorize({ authToken })
          resolve()
        } catch (error: any) {
          reject(error)
        }
      })
    } catch (error: any) {
      reject(error)
    }
  })
}

