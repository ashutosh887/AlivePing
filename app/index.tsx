import { AppIcon } from '@/components/AppIcon'
import { SolanaLogo } from '@/components/SolanaLogo'
import { Button } from '@/components/ui/Button'
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
    router.replace('/auth')
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
      <View className="flex-1 px-8 justify-between">
        <View className="flex-1 items-center justify-center -mt-12">
          <View className="items-center mb-6">
            <AppIcon size="5xl" />
            
            <Text className="text-brand-dark text-4xl font-bold mt-6 mb-3 text-center">
              {configs.appName}
            </Text>
            
            <Text className="text-brand-muted text-base text-center leading-6 px-4 max-w-md">
              {configs.appDescription}
            </Text>
          </View>

          <Button
            onPress={handleGetStarted}
            fullWidth
            size="md"
            className="max-w-[340px] bg-brand-dark gap-0 mt-8"
          >
            <View className="mr-2">
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
            Get Started
          </Button>
        </View>

        <View className="items-center pb-6">
          <Text className="text-brand-muted text-xs text-center mb-3">
            {configs.appTagline}
          </Text>
          
          <View className="flex-row items-center">
            <Text className="text-brand-muted text-xs mr-1.5">Built on</Text>
            <Pressable onPress={handleSolanaPress} hitSlop={8}>
              <SolanaLogo size={16} />
            </Pressable>
            <Text className="text-brand-muted text-xs ml-1.5 mr-1.5">by</Text>
            <Pressable onPress={handleAuthorPress} hitSlop={8}>
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