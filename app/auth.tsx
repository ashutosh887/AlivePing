import { Button } from '@/components/ui/Button'
import configs from '@/config'
import { checkConnectionHealth } from '@/lib/solana/connectionHealth'
import { clearWallet, getWalletInfo, hasWallet, validateWallet } from '@/lib/solana/wallet'
import { connectWallet, disconnectWallet } from '@/lib/solana/walletConnection'
import { useAppStore } from '@/lib/store'
import { useRouter } from 'expo-router'
import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCw, Wallet } from 'lucide-react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const AuthScreen = () => {
  const router = useRouter()
  const { wallet: walletState, setWallet, clearWallet: clearWalletStore } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(walletState.publicKey)
  const [isConnected, setIsConnected] = useState(walletState.isConnected)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkWallet()
    performHealthCheck()
  }, [])

  const performHealthCheck = async () => {
    try {
      const health = await checkConnectionHealth()
      if (!health.isHealthy && health.errors.length > 0) {
        console.warn('Connection health check failed:', health.errors)
      }
    } catch (error) {
      console.error('Health check error:', error)
    }
  }

  const checkWallet = useCallback(async () => {
    try {
      setError(null)
      const exists = await hasWallet()
      
      if (exists) {
        const isValid = await validateWallet()
        if (!isValid) {
          setError('Wallet validation failed. Please reconnect.')
          setWallet({ isConnected: false })
          return
        }

        const walletInfo = await getWalletInfo()
        if (walletInfo) {
          setWalletAddress(walletInfo.publicKey)
          setIsConnected(walletInfo.isConnected)
          setWallet({
            publicKey: walletInfo.publicKey,
            type: walletInfo.type,
            isConnected: walletInfo.isConnected,
          })
        }
      } else {
        setWalletAddress(null)
        setIsConnected(false)
        clearWalletStore()
      }
    } catch (error: any) {
      console.error('Check wallet error:', error)
      setError(`Failed to check wallet: ${error.message || 'Unknown error'}`)
      setWalletAddress(null)
      setIsConnected(false)
      setWallet({ isConnected: false })
    }
  }, [setWallet, clearWalletStore])

  const handleConnect = async () => {
    if (isConnected && walletAddress) {
      router.replace('/flows' as any)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const result = await connectWallet()
      
      setWalletAddress(result.publicKey.toBase58())
      setIsConnected(true)
      setWallet({
        publicKey: result.publicKey.toBase58(),
        type: 'mobile_wallet_adapter',
        isConnected: true,
      })
      
      await new Promise(resolve => setTimeout(resolve, 800))
      router.replace('/flows' as any)
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      setError(`Failed to connect: ${error.message || 'Unknown error'}`)
      Alert.alert(
        'Connection Error',
        `Failed to connect wallet. ${error.message || 'Please try again.'}`,
        [{ text: 'OK' }]
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true)
              await disconnectWallet()
              await clearWallet()
              clearWalletStore()
              setWalletAddress(null)
              setIsConnected(false)
              setError(null)
            } catch (error: any) {
              console.error('Disconnect error:', error)
              Alert.alert('Error', `Failed to disconnect: ${error.message || 'Unknown error'}`)
            } finally {
              setIsLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleRetry = () => {
    setError(null)
    checkWallet()
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-8 pb-6">
            <Pressable
              onPress={() => router.push('/')}
              className="mb-6 self-start p-2 rounded-xl active:opacity-70"
            >
              <ArrowLeft size={24} color="#000000" />
            </Pressable>
          </View>
          
          <View className="flex-1 px-6 items-center justify-center pb-6">
            <View className="w-32 h-32 rounded-full bg-brand-accent items-center justify-center mb-8">
              <Wallet size={64} color="#000000" strokeWidth={2.5} />
            </View>

            <Text className="text-3xl font-bold text-brand-black mb-3 text-center">
              Connect Wallet
            </Text>

            <Text className="text-base text-brand-muted text-center mb-8 px-6 leading-6">
              Connect your Solana wallet to start using {configs.appName}. You must have a Solana wallet installed on your device.
            </Text>

            {error && (
              <View className="w-full mb-6 p-4 rounded-2xl bg-red-50 border border-red-200">
                <View className="flex-row items-start gap-3">
                  <AlertCircle size={20} color="#EF4444" />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-red-800 mb-1">
                      Error
                    </Text>
                    <Text className="text-xs text-red-700 leading-4 mb-2">
                      {error}
                    </Text>
                    <Pressable
                      onPress={handleRetry}
                      className="flex-row items-center gap-2 mt-2"
                    >
                      <RefreshCw size={14} color="#EF4444" />
                      <Text className="text-xs font-semibold text-red-800">
                        Retry
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {walletAddress && (
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
                  Connected to your Solana wallet
                </Text>
              </View>
            )}

            {!isConnected && (
              <Button
                onPress={handleConnect}
                disabled={isLoading}
                loading={isLoading}
                fullWidth
                size="md"
              >
                {!isLoading && <Wallet size={20} color="#FFFFFF" />}
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}

            {isConnected && walletAddress && (
              <>
                <Button
                  onPress={() => router.replace('/flows' as any)}
                  disabled={isLoading}
                  fullWidth
                  size="md"
                  className="mt-4"
                >
                  Continue to App
                </Button>
                <Button
                  onPress={handleDisconnect}
                  disabled={isLoading}
                  variant="secondary"
                  size="md"
                  fullWidth
                  className="mt-3"
                >
                  Disconnect Wallet
                </Button>
              </>
            )}

            <Text className="mt-6 text-xs text-brand-muted text-center px-8 leading-4">
              By connecting, you agree to our terms of service. You must have a Solana wallet installed to use this app.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AuthScreen
