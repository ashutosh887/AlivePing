import { AppIcon } from '@/components/AppIcon'
import { SolanaLogo } from '@/components/SolanaLogo'
import configs from '@/config'
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import React from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const RootScreen = () => {
  const router = useRouter()
  
  const handleGetStarted = () => {
    router.replace('/flows/home')
  }

  const handleAuthorPress = async () => {
    if (configs.appAuthorGitHub) {
      const canOpen = await Linking.canOpenURL(configs.appAuthorGitHub)
      if (canOpen) {
        try {
          await Linking.openURL(configs.appAuthorGitHub)
        } catch (error) {
          Alert.alert('Error', 'Unable to open the link')
        }
      }
    }
  }

  const handleSolanaPress = async () => {
    if (configs.solanaUrl) {
      const canOpen = await Linking.canOpenURL(configs.solanaUrl)
      if (canOpen) {
        try {
          await Linking.openURL(configs.solanaUrl)
        } catch (error) {
          Alert.alert('Error', 'Unable to open the link')
        }
      }
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <View className="flex-1 px-8">
        <View className="flex-1 items-center justify-center">
          <View className="items-center mb-4">
            <AppIcon size="5xl" />
            
            <Text className="text-brand-black text-5xl font-bold mt-2 mb-1 text-center">
              {configs.appName}
            </Text>
            
            <Text className="text-brand-muted text-base text-center font-medium mb-4">
              {configs.appTagline}
            </Text>
          </View>

          <Text className="text-brand-dark text-xl text-center mb-5 leading-8 px-2 max-w-md">
            {configs.appDescription}
          </Text>

          <Pressable
            className="w-full max-w-[340px] bg-brand-black py-5 rounded-2xl items-center justify-center flex-row gap-3 mb-6"
            onPress={handleGetStarted}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-brand-white text-xl font-bold">
              Get Started
            </Text>
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="items-center gap-2 pb-6 pt-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-brand-muted text-xs">Powered by</Text>
            <Pressable onPress={handleSolanaPress} className="flex-row items-center">
              <SolanaLogo size={16} />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Text className="text-brand-muted text-xs">Made with</Text>
            <Ionicons name="heart" size={12} color="#9CA3AF" />
            <Text className="text-brand-muted text-xs">by</Text>
            <Pressable onPress={handleAuthorPress}>
              <Text className="text-brand-muted text-xs font-semibold">
                {configs.appTeam}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default RootScreen
