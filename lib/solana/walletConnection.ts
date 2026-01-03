import configs from '@/config'
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { getAuthToken, setWallet } from './wallet'

export interface AuthorizationResult {
  publicKey: PublicKey
  authToken: string
  walletName?: string
}

export const connectWallet = async (): Promise<AuthorizationResult> => {
  return new Promise((resolve, reject) => {
    try {
      transact(async (wallet: any) => {
        try {
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
          if (error?.message?.includes('secure context') || error?.message?.includes('https')) {
            reject(new Error('Wallet connection requires a secure context. Please use a development build instead of Expo Go. See https://docs.expo.dev/develop/development-builds/introduction/'))
          } else {
            reject(error)
          }
        }
      })
    } catch (error: any) {
      if (error?.message?.includes('secure context') || error?.message?.includes('https')) {
        reject(new Error('Wallet connection requires a secure context. Please use a development build instead of Expo Go. See https://docs.expo.dev/develop/development-builds/introduction/'))
      } else {
        reject(error)
      }
    }
  })
}

export const signTransaction = async (
  transaction: Transaction | VersionedTransaction
): Promise<Transaction | VersionedTransaction> => {
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

