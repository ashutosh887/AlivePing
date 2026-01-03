import { Button } from '@/components/ui/Button'
import { checkConnectionHealth } from '@/lib/solana/connectionHealth'
import { clearLocalWallet, generateLocalWallet, getLocalWalletPublicKey, hasLocalWallet } from '@/lib/solana/localWallet'
import { clearWallet, getWalletInfo, hasWallet, setWallet as setWalletStorage, validateWallet } from '@/lib/solana/wallet'
import { connectWallet, disconnectWallet } from '@/lib/solana/walletConnection'
import { useAppStore } from '@/lib/store'
import { useRouter } from 'expo-router'
import { AlertCircle, ArrowLeft, CheckCircle2, Key, RefreshCw, Wallet } from 'lucide-react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const AuthScreen = () => {
  const router = useRouter()
  const { wallet: walletState, setWallet, clearWallet: clearWalletStore } = useAppStore()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCreatingLocal, setIsCreatingLocal] = useState(false)
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
      let localExists = false
      try {
        localExists = await hasLocalWallet()
      } catch (e) {
        console.error('hasLocalWallet error:', e)
      }
      
      if (exists || localExists) {
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
        } else if (localExists) {
          const localPubKey = await getLocalWalletPublicKey()
          if (localPubKey) {
            setWalletAddress(localPubKey)
            setIsConnected(true)
            setWallet({
              publicKey: localPubKey,
              type: 'local_keypair',
              isConnected: true,
            })
          }
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

  const handleCreateLocalWallet = async () => {
    setIsCreatingLocal(true)
    setError(null)
    
    try {
      const walletInfo = await generateLocalWallet()
      
      await setWalletStorage(walletInfo.publicKey, 'local_keypair')
      
      setWalletAddress(walletInfo.publicKey)
      setIsConnected(true)
      setWallet({
        publicKey: walletInfo.publicKey,
        type: 'local_keypair',
        isConnected: true,
      })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      router.replace('/flows' as any)
    } catch (error: any) {
      console.error('Error creating local wallet:', error)
      setError(`Failed to create wallet: ${error.message || 'Unknown error'}`)
      Alert.alert(
        'Error',
        `Failed to create local wallet. ${error.message || 'Please try again.'}`,
        [{ text: 'OK' }]
      )
    } finally {
      setIsCreatingLocal(false)
    }
  }

  const handleConnect = async () => {
    if (isConnected && walletAddress) {
      router.replace('/flows' as any)
      return
    }

    setIsConnecting(true)
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
      const errorMessage = error?.message || 'Unknown error'
      setError(errorMessage)
      
      if (errorMessage.includes('secure context') || errorMessage.includes('HTTPS')) {
        setError('Mobile wallet not available. Use "Use Local Address" instead.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsConnecting(false)
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
              const walletInfo = await getWalletInfo()
              if (walletInfo?.type === 'mobile_wallet_adapter') {
                await disconnectWallet()
              } else {
                await clearLocalWallet()
              }
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

            <Text className="text-3xl font-bold text-brand-black mb-8 text-center">
              Get Started
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
                    {isConnected ? 'Connected' : 'Address'}
                  </Text>
                </View>
                <Text className="text-sm font-mono text-brand-black break-all">
                  {walletAddress}
                </Text>
              </View>
            )}

            {!isConnected && (
              <View className="w-full gap-3">
                <Button
                  onPress={handleConnect}
                  disabled={isConnecting || isCreatingLocal}
                  loading={isConnecting}
                  fullWidth
                  size="md"
                  variant="primary"
                >
                  {!isConnecting && <Wallet size={20} color="#FFFFFF" />}
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
                <Button
                  onPress={handleCreateLocalWallet}
                  disabled={isConnecting || isCreatingLocal}
                  loading={isCreatingLocal}
                  fullWidth
                  size="md"
                  variant="outline"
                >
                  {!isCreatingLocal && <Key size={20} color="#000000" />}
                  {isCreatingLocal ? 'Creating...' : 'Use Local Address'}
                </Button>
              </View>
            )}

            {isConnected && walletAddress && (
              <>
                <Button
                  onPress={() => router.replace('/flows' as any)}
                  disabled={isLoading || isConnecting || isCreatingLocal}
                  fullWidth
                  size="md"
                  className="mt-4"
                >
                  Continue to App
                </Button>
                <Button
                  onPress={handleDisconnect}
                  disabled={isLoading || isConnecting || isCreatingLocal}
                  variant="secondary"
                  size="md"
                  fullWidth
                  className="mt-3"
                >
                  Disconnect Wallet
                </Button>
              </>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AuthScreen
