import { Connection, PublicKey, Commitment } from '@solana/web3.js'

const RPC_ENDPOINTS = {
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
}

export const getConnection = (network: 'devnet' | 'mainnet' = 'devnet'): Connection => {
  return new Connection(RPC_ENDPOINTS[network], {
    commitment: 'confirmed' as Commitment,
  })
}

export const getProgramId = (): PublicKey => {
  const programId = process.env.EXPO_PUBLIC_SOLANA_PROGRAM_ID || '11111111111111111111111111111111'
  return new PublicKey(programId)
}

