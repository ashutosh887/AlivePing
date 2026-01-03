import { AnchorProvider, BN, Program, Wallet } from '@coral-xyz/anchor'
import { PublicKey, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js'
import { Buffer } from 'buffer'
import 'react-native-get-random-values'
import { getConnection, getProgramId } from './connection'
import { IDL } from './idl'
import { getOrCreateWallet } from './wallet'

export type SafetySession = {
  user: PublicKey
  startTime: number
  deadline: number
  lastPing: number
  status: number
  eventType: number
  contextHash: number[]
}

export const getProgram = async (): Promise<Program> => {
  try {
    const connection = getConnection()
    const wallet = await getWalletProvider()
    const programId = getProgramId()
    
    const defaultPubkey = new PublicKey('11111111111111111111111111111111')
    if (programId.equals(defaultPubkey)) {
      console.warn('Using default program ID. Please deploy contract and update EXPO_PUBLIC_SOLANA_PROGRAM_ID in .env')
    }
    
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    })
    
    const program = new (Program as any)(IDL, programId, provider) as Program
    return program
  } catch (error: any) {
    console.error('Error creating program:', error)
    if (error.message?.includes('_bn')) {
      throw new Error('Program initialization failed. Please ensure the contract is deployed and EXPO_PUBLIC_SOLANA_PROGRAM_ID is set correctly.')
    }
    throw error
  }
}

export const getWalletProvider = async (): Promise<Wallet> => {
  const { getWalletInfo } = await import('./wallet')
  const walletInfo = await getWalletInfo()
  
  if (walletInfo?.type === 'phantom') {
    console.warn(
      'Phantom wallet detected. Transaction signing will use local wallet. ' +
      'For full Phantom support, implement Wallet Adapter protocol.'
    )
  }
  
  const keypair = await getOrCreateWallet()
  
  if (!keypair.publicKey) {
    throw new Error('Invalid wallet: missing public key')
  }
  
  return {
    publicKey: keypair.publicKey,
    payer: keypair,
    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      if (tx instanceof Transaction) {
        tx.sign(keypair)
      }
      return tx
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      return txs.map(tx => {
        if (tx instanceof Transaction) {
          tx.sign(keypair)
        }
        return tx
      })
    },
  } as Wallet
}

export const getSessionPDA = async (userPublicKey: PublicKey): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('safety_session'), userPublicKey.toBuffer()],
    getProgramId()
  )
}

export const startCheckIn = async (
  deadline: number,
  contextHash: number[]
): Promise<string> => {
  const program = await getProgram()
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  const contextHashArray = new Uint8Array(contextHash)
  if (contextHashArray.length !== 32) {
    throw new Error('Context hash must be 32 bytes')
  }

  const hashBuffer = Buffer.from(contextHashArray)

  const deadlineBN = new BN(deadline.toString())

  const tx = await program.methods
    .startCheckIn(deadlineBN, Array.from(hashBuffer))
    .accounts({
      user: wallet.publicKey,
      session: sessionPDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return tx
}

export const confirmSafe = async (): Promise<string> => {
  const program = await getProgram()
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  const tx = await program.methods
    .confirmSafe()
    .accounts({
      user: wallet.publicKey,
      session: sessionPDA,
    })
    .rpc()

  return tx
}

export const expireCheckIn = async (): Promise<string> => {
  const program = await getProgram()
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  const tx = await program.methods
    .expireCheckIn()
    .accounts({
      user: wallet.publicKey,
      session: sessionPDA,
    })
    .rpc()

  return tx
}

export const getSession = async (): Promise<SafetySession | null> => {
  try {
    const program = await getProgram()
    const wallet = await getWalletProvider()
    const [sessionPDA] = await getSessionPDA(wallet.publicKey)

    const session = await (program.account as any).safetySession.fetch(sessionPDA)
    
    const toNumber = (val: any): number => {
      if (val && typeof val === 'object' && 'toNumber' in val) {
        return val.toNumber()
      }
      return Number(val) || 0
    }
    
    return {
      user: session.user,
      startTime: toNumber(session.startTime),
      deadline: toNumber(session.deadline),
      lastPing: toNumber(session.lastPing),
      status: session.status,
      eventType: session.eventType || 0,
      contextHash: Array.from(session.contextHash),
    }
  } catch (error) {
    return null
  }
}

export const updateLastPing = async (): Promise<string> => {
  const program = await getProgram()
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  const tx = await program.methods
    .updateLastPing()
    .accounts({
      user: wallet.publicKey,
      session: sessionPDA,
    })
    .rpc()

  return tx
}

export const triggerPanic = async (
  contextHash: number[]
): Promise<string> => {
  const program = await getProgram()
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  const contextHashArray = new Uint8Array(contextHash)
  if (contextHashArray.length !== 32) {
    throw new Error('Context hash must be 32 bytes')
  }

  const hashBuffer = Buffer.from(contextHashArray)

  const tx = await program.methods
    .triggerPanic(Array.from(hashBuffer))
    .accounts({
      user: wallet.publicKey,
      session: sessionPDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return tx
}

export const closeSession = async (): Promise<string> => {
  const program = await getProgram()
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  const tx = await program.methods
    .closeSession()
    .accounts({
      user: wallet.publicKey,
      session: sessionPDA,
    })
    .rpc()

  return tx
}

export const cancelCheckIn = async (): Promise<string> => {
  const program = await getProgram()
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  const tx = await program.methods
    .cancelCheckIn()
    .accounts({
      user: wallet.publicKey,
      session: sessionPDA,
    })
    .rpc()

  return tx
}

