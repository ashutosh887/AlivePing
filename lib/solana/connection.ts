import { Commitment, Connection, PublicKey } from '@solana/web3.js'

const RPC_ENDPOINTS = {
  testnet: 'https://api.testnet.solana.com',
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
}

const BACKUP_RPC_ENDPOINTS = {
  testnet: [
    'https://api.testnet.solana.com',
    'https://rpc.ankr.com/solana_testnet',
    'https://solana-testnet-rpc.allthatnode.com',
  ],
  devnet: [
    'https://api.devnet.solana.com',
    'https://rpc.ankr.com/solana_devnet',
  ],
  mainnet: [
    'https://api.mainnet-beta.solana.com',
    'https://rpc.ankr.com/solana',
    'https://solana-api.projectserum.com',
  ],
}

let currentRpcIndex = 0

export const getConnection = (network: 'testnet' | 'devnet' | 'mainnet' = 'testnet'): Connection => {
  const endpoints = BACKUP_RPC_ENDPOINTS[network] || [RPC_ENDPOINTS[network]]
  const endpoint = endpoints[currentRpcIndex % endpoints.length]
  
  return new Connection(endpoint, {
    commitment: 'confirmed' as Commitment,
  })
}

export const switchToBackupRPC = (network: 'testnet' | 'devnet' | 'mainnet' = 'testnet') => {
  const endpoints = BACKUP_RPC_ENDPOINTS[network] || [RPC_ENDPOINTS[network]]
  currentRpcIndex = (currentRpcIndex + 1) % endpoints.length
  console.log(`Switched to backup RPC: ${endpoints[currentRpcIndex]}`)
}

export const getProgramId = (): PublicKey => {
  const programId = process.env.EXPO_PUBLIC_SOLANA_PROGRAM_ID
  
  if (!programId) {
    throw new Error(
      'EXPO_PUBLIC_SOLANA_PROGRAM_ID is not set in .env file. ' +
      'Please set it to your deployed program ID (e.g., 9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e for testnet)'
    )
  }
  
  const defaultPlaceholder = '11111111111111111111111111111111'
  if (programId === defaultPlaceholder) {
    throw new Error(
      'EXPO_PUBLIC_SOLANA_PROGRAM_ID is set to the default placeholder. ' +
      'Please update it with your deployed program ID from .env file.'
    )
  }
  
  try {
    return new PublicKey(programId)
  } catch (error) {
    throw new Error(
      `Invalid program ID in EXPO_PUBLIC_SOLANA_PROGRAM_ID: ${programId}. ` +
      'Expected format: Base58 encoded public key (44 characters)'
    )
  }
}

