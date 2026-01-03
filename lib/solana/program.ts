import { AnchorProvider, BN, Idl, Program, Wallet } from '@coral-xyz/anchor'
import { PublicKey, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js'
import { Buffer } from 'buffer'
import 'react-native-get-random-values'

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer
}

if (!Buffer.prototype.subarray) {
  Buffer.prototype.subarray = function subarray(begin: number | undefined, end: number | undefined) {
    const result = Uint8Array.prototype.subarray.apply(this, [begin, end])
    Object.setPrototypeOf(result, Buffer.prototype)
    return result
  }
}

import { getConnection } from './connection'
import { IDL } from './idl'
import { getLocalWallet } from './localWallet'
import { getWalletInfo } from './wallet'
import { signAllTransactions, signTransaction } from './walletConnection'

export type SafetySession = {
  user: PublicKey
  startTime: number
  deadline: number
  lastPing: number
  status: number
  eventType: number
  contextHash: number[]
}

let cachedProgram: Program | null = null

export const getProgram = async (): Promise<Program | null> => {
  if (cachedProgram) {
    return cachedProgram
  }

  try {
    const connection = getConnection()
    const wallet = await getWalletProvider()
    
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    })
    
    const programId = new PublicKey('9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e')
    
    cachedProgram = new Program(IDL as Idl, programId, provider)
    return cachedProgram
  } catch (error: any) {
    console.error('Error creating program:', error)
    return null
  }
}

export const getWalletProvider = async (): Promise<Wallet> => {
  const walletInfo = await getWalletInfo()
  
  if (!walletInfo || !walletInfo.isConnected) {
    throw new Error('No wallet connected. Please connect your wallet first.')
  }
  
  const publicKey = new PublicKey(walletInfo.publicKey)
  
  if (walletInfo.type === 'local_keypair') {
    const keypair = await getLocalWallet()
    if (!keypair) {
      throw new Error('Local wallet not found')
    }
    
    return {
      publicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
        if (tx instanceof Transaction) {
          tx.sign(keypair)
          return tx as T
        } else {
          throw new Error('Versioned transactions not supported with local wallet')
        }
      },
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
        return txs.map(tx => {
          if (tx instanceof Transaction) {
            tx.sign(keypair)
            return tx as T
          }
          throw new Error('Versioned transactions not supported with local wallet')
        })
      },
    } as Wallet
  }
  
  return {
    publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      return await signTransaction(tx) as T
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      return await signAllTransactions(txs) as T[]
    },
  } as Wallet
}

export const getSessionPDA = async (userPublicKey: PublicKey): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('safety_session'), userPublicKey.toBuffer()],
    new PublicKey('9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e')
  )
}

export const startCheckIn = async (
  deadline: number,
  contextHash: number[]
): Promise<string | null> => {
  const program = await getProgram()
  if (!program) {
    console.error('Program not initialized')
    return null
  }
  
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  const contextHashArray = new Uint8Array(contextHash)
  if (contextHashArray.length !== 32) {
    throw new Error('Context hash must be 32 bytes')
  }

  const hashBuffer = Buffer.from(contextHashArray)
  const deadlineBN = new BN(deadline.toString())

  try {
    const tx = await program.methods
      .startCheckIn(deadlineBN, Array.from(hashBuffer))
      .accounts({
        user: wallet.publicKey,
        session: sessionPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    return tx
  } catch (error) {
    console.error('Start check-in transaction error:', error)
    return null
  }
}

export const confirmSafe = async (): Promise<string | null> => {
  const program = await getProgram()
  if (!program) {
    console.error('Program not initialized')
    return null
  }
  
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  try {
    const tx = await program.methods
      .confirmSafe()
      .accounts({
        user: wallet.publicKey,
        session: sessionPDA,
      })
      .rpc()

    return tx
  } catch (error) {
    console.error('Confirm safe transaction error:', error)
    return null
  }
}

export const expireCheckIn = async (): Promise<string | null> => {
  const program = await getProgram()
  if (!program) return null
  
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  try {
    const tx = await program.methods
      .expireCheckIn()
      .accounts({
        user: wallet.publicKey,
        session: sessionPDA,
      })
      .rpc()

    return tx
  } catch (error) {
    console.error('Expire check-in transaction error:', error)
    return null
  }
}

export const getSession = async (): Promise<SafetySession | null> => {
  try {
    const program = await getProgram()
    if (!program) return null
    
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

export const updateLastPing = async (): Promise<string | null> => {
  const program = await getProgram()
  if (!program) return null
  
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  try {
    const tx = await program.methods
      .updateLastPing()
      .accounts({
        user: wallet.publicKey,
        session: sessionPDA,
      })
      .rpc()

    return tx
  } catch (error) {
    console.error('Update last ping transaction error:', error)
    return null
  }
}

export const triggerPanic = async (
  contextHash: number[]
): Promise<string | null> => {
  const program = await getProgram()
  if (!program) return null
  
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  const contextHashArray = new Uint8Array(contextHash)
  if (contextHashArray.length !== 32) {
    throw new Error('Context hash must be 32 bytes')
  }

  const hashBuffer = Buffer.from(contextHashArray)

  try {
    const tx = await program.methods
      .triggerPanic(Array.from(hashBuffer))
      .accounts({
        user: wallet.publicKey,
        session: sessionPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    return tx
  } catch (error) {
    console.error('Trigger panic transaction error:', error)
    return null
  }
}

export const closeSession = async (): Promise<string | null> => {
  const program = await getProgram()
  if (!program) return null
  
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  try {
    const tx = await program.methods
      .closeSession()
      .accounts({
        user: wallet.publicKey,
        session: sessionPDA,
      })
      .rpc()

    return tx
  } catch (error) {
    console.error('Close session transaction error:', error)
    return null
  }
}

export const cancelCheckIn = async (): Promise<string | null> => {
  const program = await getProgram()
  if (!program) return null
  
  const wallet = await getWalletProvider()
  const [sessionPDA] = await getSessionPDA(wallet.publicKey)

  try {
    const tx = await program.methods
      .cancelCheckIn()
      .accounts({
        user: wallet.publicKey,
        session: sessionPDA,
      })
      .rpc()

    return tx
  } catch (error) {
    console.error('Cancel check-in transaction error:', error)
    return null
  }
}