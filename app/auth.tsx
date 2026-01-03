import { clearWallet, getWalletPublicKey } from '@/lib/solana/wallet'
import { useRouter } from 'expo-router'
import { CheckCircle2, Wallet } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const AuthScreen = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    checkWallet()
  }, [])

  const checkWallet = async () => {
    try {
      const address = await getWalletPublicKey()
      setWalletAddress(address)
    } catch (error) {
      console.error('Check wallet error:', error)
    }
  }

  const handleConnect = async () => {
    if (isConnected) {
      router.replace('/flows' as any)
      return
    }

    setIsLoading(true)
    setIsGenerating(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const address = await getWalletPublicKey()
      setWalletAddress(address)
      
      await new Promise(resolve => setTimeout(resolve, 600))
      setIsGenerating(false)
      setIsConnected(true)
      
      await new Promise(resolve => setTimeout(resolve, 800))
      router.replace('/flows' as any)
    } catch (error) {
      console.error('Connect error:', error)
      Alert.alert('Error', 'Failed to connect wallet. Please try again.')
      setIsGenerating(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear your wallet and all data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearWallet()
              setWalletAddress(null)
              setIsConnected(false)
            } catch (error) {
              console.error('Logout error:', error)
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 items-center justify-center">
        <View className="w-32 h-32 rounded-full bg-brand-accent items-center justify-center mb-8 shadow-lg">
          <Wallet size={64} color="#000000" strokeWidth={2.5} />
        </View>

        <Text className="text-3xl font-bold text-brand-black mb-3 text-center">
          Connect Wallet
        </Text>

        <Text className="text-base text-brand-muted text-center mb-8 px-6 leading-6">
          Connect your Solana wallet to start using AlivePing. Your wallet is securely stored on your device.
        </Text>

        {isGenerating && (
          <View className="w-full mb-6 p-5 rounded-2xl bg-brand-light">
            <View className="flex-row items-center gap-3 mb-3">
              <ActivityIndicator color="#000000" size="small" />
              <Text className="text-sm font-semibold text-brand-black">
                Generating secure wallet...
              </Text>
            </View>
            <Text className="text-xs text-brand-muted leading-4">
              Creating a new Solana keypair stored securely on your device
            </Text>
          </View>
        )}

        {walletAddress && !isGenerating && (
          <View className="w-full mb-6 p-5 rounded-2xl bg-brand-light">
            <View className="flex-row items-center gap-2 mb-3">
              {isConnected && <CheckCircle2 size={16} color="#10B981" fill="#10B981" />}
              <Text className="text-xs font-semibold text-brand-muted uppercase">
                {isConnected ? 'Wallet Connected' : 'Wallet Address'}
              </Text>
            </View>
            <Text className="text-sm font-mono text-brand-black break-all mb-2">
              {walletAddress}
            </Text>
            <Text className="text-xs text-brand-muted leading-4">
              Your private key is encrypted and stored securely on this device
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleConnect}
          disabled={isLoading}
          className="w-full py-5 rounded-2xl bg-brand-black active:opacity-90 disabled:opacity-50 shadow-lg flex-row items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <ActivityIndicator color="#FFFFFF" />
              <Text className="text-brand-white text-xl font-semibold">
                {isGenerating ? 'Generating...' : isConnected ? 'Connecting...' : 'Connecting...'}
              </Text>
            </>
          ) : (
            <>
              <Wallet size={24} color="#FFFFFF" />
              <Text className="text-brand-white text-xl font-semibold">
                {isConnected ? 'Continue to App' : walletAddress ? 'Connect Wallet' : 'Create Wallet'}
              </Text>
            </>
          )}
        </Pressable>

        {walletAddress && !isGenerating && (
          <Pressable
            onPress={handleLogout}
            className="mt-4 py-3 px-6 rounded-xl active:opacity-80"
          >
            <Text className="text-sm font-semibold text-brand-muted text-center">
              Use Different Wallet
            </Text>
          </Pressable>
        )}

        <Text className="mt-6 text-xs text-brand-muted text-center px-8 leading-4">
          By connecting, you agree to our terms of service. Your private key never leaves your device.
        </Text>
      </View>
    </SafeAreaView>
  )
}

export default AuthScreen

