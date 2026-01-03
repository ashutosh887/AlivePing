import * as Linking from 'expo-linking'
import { PublicKey } from '@solana/web3.js'
import { setPhantomWallet } from './wallet'

const PHANTOM_SCHEMES = {
  ios: 'phantom://',
  android: 'https://phantom.app/ul/v1/',
  universal: 'https://phantom.app/ul/v1/',
}

export const isPhantomInstalled = async (): Promise<boolean> => {
  try {
    const canOpen = await Linking.canOpenURL(PHANTOM_SCHEMES.ios)
    return canOpen
  } catch {
    try {
      const canOpen = await Linking.canOpenURL(PHANTOM_SCHEMES.android)
      return canOpen
    } catch {
      return false
    }
  }
}

export const connectPhantom = async (): Promise<string | null> => {
  try {
    const appUrl = Linking.createURL('/auth?wallet=phantom')
    const redirectUrl = encodeURIComponent(appUrl)
    const connectionUrl = `${PHANTOM_SCHEMES.universal}connect?app_url=${redirectUrl}&redirect_link=${redirectUrl}`
    
    const canOpen = await Linking.canOpenURL(connectionUrl)
    
    if (canOpen) {
      await Linking.openURL(connectionUrl)
      return null
    } else {
      const phantomUrl = PHANTOM_SCHEMES.ios
      const canOpenPhantom = await Linking.canOpenURL(phantomUrl)
      
      if (canOpenPhantom) {
        await Linking.openURL(phantomUrl)
      }
      
      throw new Error('Unable to open Phantom wallet. Please ensure Phantom is installed.')
    }
  } catch (error: any) {
    console.error('Error connecting to Phantom:', error)
    throw new Error(`Failed to connect to Phantom: ${error.message || 'Unknown error'}`)
  }
}

export const handlePhantomCallback = async (url: string): Promise<string | null> => {
  try {
    const parsedUrl = Linking.parse(url)
    const publicKey = parsedUrl.queryParams?.publicKey as string | undefined
    
    if (publicKey) {
      try {
        const pubkey = new PublicKey(publicKey)
        await setPhantomWallet(pubkey.toBase58())
        
        return pubkey.toBase58()
      } catch (error) {
        console.error('Invalid public key from Phantom:', error)
        throw new Error('Invalid public key received from Phantom')
      }
    }
    
    return null
  } catch (error: any) {
    console.error('Error handling Phantom callback:', error)
    throw new Error(`Failed to process Phantom connection: ${error.message || 'Unknown error'}`)
  }
}

export const disconnectPhantom = async (): Promise<void> => {
}

export const connectPhantomManually = async (publicKey: string): Promise<void> => {
  try {
    const pubkey = new PublicKey(publicKey)
    await setPhantomWallet(pubkey.toBase58())
  } catch (error: any) {
    console.error('Error connecting Phantom manually:', error)
    throw new Error(`Invalid Phantom public key: ${error.message || 'Unknown error'}`)
  }
}

