import { Keypair } from '@solana/web3.js'
import { secureStoreGetItemAsync, secureStoreSetItemAsync, secureStoreDeleteItemAsync } from '@/lib/utils/secureStore'

const LOCAL_WALLET_KEY = 'aliveping_local_wallet_keypair'
const LOCAL_WALLET_TYPE = 'local_keypair'

export interface LocalWalletInfo {
  publicKey: string
  secretKey: Uint8Array
}

export const generateLocalWallet = async (): Promise<LocalWalletInfo> => {
  const keypair = Keypair.generate()
  
  const walletInfo: LocalWalletInfo = {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
  }

  const secretKeyBase64 = Buffer.from(keypair.secretKey).toString('base64')
  await secureStoreSetItemAsync(LOCAL_WALLET_KEY, secretKeyBase64)
  await secureStoreSetItemAsync('aliveping_wallet_type', LOCAL_WALLET_TYPE)
  await secureStoreSetItemAsync('aliveping_wallet_public_key', keypair.publicKey.toBase58())

  return walletInfo
}

export const getLocalWallet = async (): Promise<Keypair | null> => {
  try {
    const secretKeyBase64 = await secureStoreGetItemAsync(LOCAL_WALLET_KEY)
    if (!secretKeyBase64) {
      return null
    }

    const secretKey = Buffer.from(secretKeyBase64, 'base64')
    const keypair = Keypair.fromSecretKey(secretKey)
    return keypair
  } catch (error) {
    return null
  }
}

export const hasLocalWallet = async (): Promise<boolean> => {
  try {
    const walletType = await secureStoreGetItemAsync('aliveping_wallet_type')
    return walletType === LOCAL_WALLET_TYPE
  } catch {
    return false
  }
}

export const clearLocalWallet = async (): Promise<void> => {
  try {
    await secureStoreDeleteItemAsync(LOCAL_WALLET_KEY)
  } catch (error) {
  }
}

export const getLocalWalletPublicKey = async (): Promise<string | null> => {
  try {
    const keypair = await getLocalWallet()
    return keypair ? keypair.publicKey.toBase58() : null
  } catch {
    return null
  }
}

