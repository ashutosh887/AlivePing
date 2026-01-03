import configs from '@/config'
import { checkConnectionHealth } from '@/lib/solana/connectionHealth'
import { connectPhantom, connectPhantomManually, isPhantomInstalled } from '@/lib/solana/phantom'
import { clearWallet, getWalletInfo, getWalletPublicKey, hasWallet, validateWallet, WalletType } from '@/lib/solana/wallet'
import { useAppStore } from '@/lib/store'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { AlertCircle, CheckCircle2, RefreshCw, Wallet } from 'lucide-react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000

const AuthScreen = () => {
  const router = useRouter()
  const { wallet: walletState, setWallet, clearWallet: clearWalletStore } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(walletState.publicKey)
  const [walletType, setWalletType] = useState<WalletType | null>(walletState.type)
  const [isConnected, setIsConnected] = useState(walletState.isConnected)
  const [error, setError] = useState<string | null>(null)
  const [isPhantomAvailable, setIsPhantomAvailable] = useState(false)
  const [showManualPhantomInput, setShowManualPhantomInput] = useState(false)
  const [manualPhantomKey, setManualPhantomKey] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      if (event.url.includes('wallet=phantom')) {
        try {
          const parsed = Linking.parse(event.url)
          const publicKey = parsed.queryParams?.publicKey as string
          
          if (publicKey) {
            await connectPhantomManually(publicKey)
            await checkWallet()
            setIsConnected(true)
            setShowManualPhantomInput(false)
          }
        } catch (error: any) {
          console.error('Deep link error:', error)
          setError(`Failed to connect Phantom: ${error.message || 'Unknown error'}`)
        }
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url })
      }
    })

    const subscription = Linking.addEventListener('url', handleDeepLink)

    return () => {
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    checkPhantomAvailability()
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

  const checkPhantomAvailability = async () => {
    try {
      const available = await isPhantomInstalled()
      setIsPhantomAvailable(available)
    } catch (error) {
      console.error('Error checking Phantom availability:', error)
      setIsPhantomAvailable(false)
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
          setWalletType(walletInfo.type)
          setIsConnected(walletInfo.isConnected)
          setWallet({
            publicKey: walletInfo.publicKey,
            type: walletInfo.type,
            isConnected: walletInfo.isConnected,
          })
        } else {
          const address = await getWalletPublicKey()
          setWalletAddress(address)
          setWalletType('local')
          setIsConnected(true)
          setWallet({
            publicKey: address,
            type: 'local',
            isConnected: true,
          })
        }
      } else {
        setWalletAddress(null)
        setIsConnected(false)
        setWalletType(null)
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

  const handleConnect = async (usePhantom: boolean = false) => {
    if (isConnected && walletAddress) {
      router.replace('/flows' as any)
      return
    }

    setIsLoading(true)
    setIsGenerating(true)
    setError(null)
    setRetryCount(0)
    
    try {
      if (usePhantom && isPhantomAvailable) {
        try {
          await connectPhantom()
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const walletInfo = await getWalletInfo()
          if (walletInfo && walletInfo.type === 'phantom') {
            setWalletAddress(walletInfo.publicKey)
            setWalletType('phantom')
            setIsGenerating(false)
            setIsConnected(true)
            setWallet({
              publicKey: walletInfo.publicKey,
              type: 'phantom',
              isConnected: true,
            })
            await new Promise(resolve => setTimeout(resolve, 800))
            router.replace('/flows' as any)
            return
          } else {
            setShowManualPhantomInput(true)
            setIsGenerating(false)
            setIsLoading(false)
            return
          }
        } catch (phantomError: any) {
          console.error('Phantom connection error:', phantomError)
          setError(`Phantom connection failed: ${phantomError.message || 'Unknown error'}. Creating local wallet instead.`)
        }
      }

      let lastError: Error | null = null
      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          setRetryCount(attempt + 1)
          
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt))
          }
          
          await new Promise(resolve => setTimeout(resolve, 800))
          
          const address = await getWalletPublicKey()
          
          if (!address || address.length < 32) {
            throw new Error('Invalid wallet address generated')
          }
          
          setWalletAddress(address)
          setWalletType('local')
          
          setWallet({
            publicKey: address,
            type: 'local',
            isConnected: true,
          })
          
          await new Promise(resolve => setTimeout(resolve, 600))
          setIsGenerating(false)
          setIsConnected(true)
          
          await new Promise(resolve => setTimeout(resolve, 800))
          router.replace('/flows' as any)
          return
        } catch (error: any) {
          lastError = error
          console.error(`Wallet creation attempt ${attempt + 1} failed:`, error)
          
          if (attempt === MAX_RETRY_ATTEMPTS - 1) {
            throw error
          }
        }
      }
      
      if (lastError) {
        throw lastError
      }
    } catch (error: any) {
      console.error('Connect error:', error)
      setError(`Failed to connect wallet: ${error.message || 'Please try again.'}`)
      setIsGenerating(false)
      Alert.alert(
        'Connection Error',
        error.message || 'Failed to connect wallet. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
            onPress: () => {
              setRetryCount(0)
              handleConnect(usePhantom)
            },
          },
        ]
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualPhantomConnect = async () => {
    if (!manualPhantomKey.trim()) {
      setError('Please enter a valid Phantom wallet address')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await connectPhantomManually(manualPhantomKey.trim())
      const walletInfo = await getWalletInfo()
      if (walletInfo) {
        setWallet({
          publicKey: walletInfo.publicKey,
          type: walletInfo.type,
          isConnected: true,
        })
      }
      await checkWallet()
      setIsConnected(true)
      setShowManualPhantomInput(false)
      setManualPhantomKey('')
      await new Promise(resolve => setTimeout(resolve, 800))
      router.replace('/flows' as any)
    } catch (error: any) {
      console.error('Manual Phantom connect error:', error)
      setError(`Failed to connect: ${error.message || 'Invalid wallet address'}`)
      Alert.alert('Connection Error', error.message || 'Invalid Phantom wallet address. Please check and try again.')
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
              setIsLoading(true)
              await clearWallet()
              clearWalletStore()
              setWalletAddress(null)
              setIsConnected(false)
              setWalletType(null)
              setError(null)
              setShowManualPhantomInput(false)
              setManualPhantomKey('')
            } catch (error: any) {
              console.error('Logout error:', error)
              Alert.alert('Error', `Failed to logout: ${error.message || 'Unknown error'}`)
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
    setRetryCount(0)
    checkWallet()
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 items-center justify-center">
          <View className="w-32 h-32 rounded-full bg-brand-accent items-center justify-center mb-8 shadow-lg">
            <Wallet size={64} color="#000000" strokeWidth={2.5} />
          </View>

          <Text className="text-3xl font-bold text-brand-black mb-3 text-center">
            Connect Wallet
          </Text>

          <Text className="text-base text-brand-muted text-center mb-8 px-6 leading-6">
            Connect your Solana wallet to start using {configs.appName}. Your wallet is securely stored on your device.
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

          {isGenerating && (
            <View className="w-full mb-6 p-5 rounded-2xl bg-brand-light">
              <View className="flex-row items-center gap-3 mb-3">
                <ActivityIndicator color="#000000" size="small" />
                <Text className="text-sm font-semibold text-brand-black">
                  {retryCount > 0 ? `Retrying... (${retryCount}/${MAX_RETRY_ATTEMPTS})` : 'Generating secure wallet...'}
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
                  {isConnected ? `${walletType === 'phantom' ? 'Phantom' : 'Local'} Wallet Connected` : 'Wallet Address'}
                </Text>
              </View>
              <Text className="text-sm font-mono text-brand-black break-all mb-2">
                {walletAddress}
              </Text>
              <Text className="text-xs text-brand-muted leading-4">
                {walletType === 'phantom' 
                  ? 'Connected to your Phantom wallet'
                  : 'Your private key is encrypted and stored securely on this device'}
              </Text>
            </View>
          )}

          {showManualPhantomInput && (
            <View className="w-full mb-6 p-5 rounded-2xl bg-brand-light border-2 border-brand-accent">
              <Text className="text-sm font-semibold text-brand-black mb-3">
                Enter Phantom Wallet Address
              </Text>
              <TextInput
                value={manualPhantomKey}
                onChangeText={setManualPhantomKey}
                placeholder="Paste your Phantom wallet address here"
                placeholderTextColor="#9CA3AF"
                className="w-full p-3 rounded-xl bg-white border border-brand-muted text-brand-black mb-3 font-mono text-sm"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleManualPhantomConnect}
                  disabled={isLoading || !manualPhantomKey.trim()}
                  className="flex-1 py-3 rounded-xl bg-brand-black active:opacity-90 disabled:opacity-50"
                >
                  <Text className="text-brand-white text-center font-semibold">
                    Connect
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowManualPhantomInput(false)
                    setManualPhantomKey('')
                    setError(null)
                  }}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl bg-brand-muted/20 active:opacity-80"
                >
                  <Text className="text-brand-black text-center font-semibold">
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {!showManualPhantomInput && (
            <>
              {isPhantomAvailable && !walletAddress && (
                <Pressable
                  onPress={() => handleConnect(true)}
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-purple-600 active:opacity-90 disabled:opacity-50 shadow-lg flex-row items-center justify-center gap-3 mb-3"
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text className="text-white text-lg font-semibold">
                        Connecting to Phantom...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Wallet size={22} color="#FFFFFF" />
                      <Text className="text-white text-lg font-semibold">
                        Connect with Phantom
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              <Pressable
                onPress={() => handleConnect(false)}
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
                      {isConnected ? 'Continue to App' : walletAddress ? 'Connect Wallet' : 'Create Local Wallet'}
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          )}

          {walletAddress && !isGenerating && !showManualPhantomInput && (
            <Pressable
              onPress={handleLogout}
              disabled={isLoading}
              className="mt-4 py-3 px-6 rounded-xl active:opacity-80 disabled:opacity-50"
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AuthScreen

