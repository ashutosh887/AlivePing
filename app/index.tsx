import { AppIcon } from '@/components/AppIcon'
import { SolanaLogo } from '@/components/SolanaLogo'
import configs from '@/config'
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Props = {
  onGetStarted?: () => void
}

const RootScreen = ({ onGetStarted }: Props) => {
  const handleAuthorPress = () => {
    if (configs.appAuthorGitHub) {
      Linking.openURL(configs.appAuthorGitHub)
    }
  }

  const handleSolanaPress = () => {
    if (configs.solanaUrl) {
      Linking.openURL(configs.solanaUrl)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <View className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          {/* Logo Section */}
          <View className="mb-12">
            <AppIcon size="3xl" />
          </View>

          {/* App Name */}
          <Text className="text-brand-black text-4xl font-bold mb-4 text-center">
            {configs.appName}
          </Text>

          {/* Description */}
          <Text className="text-brand-dark text-lg text-center mb-12 leading-7 px-4 max-w-sm">
            {configs.appDescription}
          </Text>

          {/* Get Started Button */}
          <Pressable
            className="w-full max-w-[320px] bg-brand-black py-4 rounded-2xl items-center justify-center flex-row gap-3 mb-8 shadow-lg"
            onPress={onGetStarted}
          >
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            <Text className="text-brand-white text-lg font-semibold">
              Get Started
            </Text>
          </Pressable>

          {/* Tagline */}
          <Text className="text-brand-muted text-sm text-center font-medium">
            {configs.appTagline}
          </Text>
        </View>

        {/* Footer */}
        <View className="items-center gap-4 pb-8 pt-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-brand-muted text-sm">Powered by</Text>
            <Pressable onPress={handleSolanaPress} className="flex-row items-center gap-1.5">
              <SolanaLogo size={16} />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-2">
            <Text className="text-brand-muted text-sm">Built with ❤️ by</Text>
            <Pressable onPress={handleAuthorPress}>
              <Text className="text-brand-muted text-sm font-semibold underline">
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
