import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from '@web3auth/base'
import { SolanaPrivateKeyProvider } from '@web3auth/solana-provider'
import { clusterApiUrl } from '@solana/web3.js'

const clientId = process.env.EXPO_PUBLIC_WEB3AUTH_CLIENT_ID || ''

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: '0x3',
  rpcTarget: clusterApiUrl('testnet'),
  displayName: 'Solana Testnet',
  blockExplorerUrl: 'https://explorer.solana.com/?cluster=testnet',
  ticker: 'SOL',
  tickerName: 'Solana',
  logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
}

const privateKeyProvider = new SolanaPrivateKeyProvider({
  config: { chainConfig },
})

const Web3AuthClass = require('@web3auth/react-native-sdk').Web3AuthNoModal || require('@web3auth/react-native-sdk').Web3Auth || require('@web3auth/react-native-sdk').default

export const web3auth: any = new Web3AuthClass({
  clientId,
  network: WEB3AUTH_NETWORK.TESTNET,
  chainConfig,
  privateKeyProvider,
})

export const initWeb3Auth = async () => {
  try {
    await web3auth.init()
  } catch (error) {
    console.error('Web3Auth init error:', error)
  }
}

export const login = async () => {
  try {
    const provider = await web3auth.connect()
    return provider
  } catch (error) {
    console.error('Web3Auth login error:', error)
    throw error
  }
}

export const logout = async () => {
  try {
    await web3auth.logout()
  } catch (error) {
    console.error('Web3Auth logout error:', error)
  }
}

export const getUserInfo = async () => {
  try {
    const user = await web3auth.getUserInfo()
    return user
  } catch (error) {
    console.error('Web3Auth getUserInfo error:', error)
    return null
  }
}

export const getProvider = (): IProvider | null => {
  return web3auth.provider
}

