import { ArrowLeft, Shield, Zap } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import React from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const AboutScreen = () => {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center px-6 pt-4 pb-8">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 p-2 rounded-xl active:opacity-70"
          >
            <ArrowLeft size={24} color="#000000" />
          </Pressable>
          <Text className="text-2xl font-bold text-brand-black">
            About AlivePing
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="items-center mb-10">
            <View className="w-36 h-36 rounded-2xl bg-brand-accent items-center justify-center mb-5 overflow-hidden shadow-sm">
              <Image
                source={require('@/assets/images/logo.png')}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
            <Text className="text-2xl font-bold text-brand-black mb-2">
              AlivePing
            </Text>
            <Text className="text-sm text-brand-muted">
              Version 1.0.0
            </Text>
          </View>

          <View className="mb-8">
            <Text className="text-lg font-semibold text-brand-black mb-4">
              Your last-mile personal safety system
            </Text>
            <Text className="text-base text-brand-muted leading-6 mb-4">
              AlivePing automatically alerts your trusted contacts if you fail to check in, 
              providing a safety net for when you need it most.
            </Text>
            <Text className="text-base text-brand-muted leading-6">
              Built with privacy and reliability in mind, using Solana blockchain for 
              immutable proof of safety check-ins.
            </Text>
          </View>

          <View className="gap-4 mb-6">
            <View className="p-5 rounded-2xl bg-white shadow-sm">
              <View className="flex-row items-center gap-3 mb-3">
                <Zap size={20} color="#000000" />
                <Text className="text-base font-semibold text-brand-black">
                  Fast & Reliable
                </Text>
              </View>
              <Text className="text-sm text-brand-muted leading-5">
                Instant alerts with automatic escalation to ensure help arrives when needed.
              </Text>
            </View>

            <View className="p-5 rounded-2xl bg-white shadow-sm">
              <View className="flex-row items-center gap-3 mb-3">
                <Shield size={20} color="#000000" />
                <Text className="text-base font-semibold text-brand-black">
                  Privacy First
                </Text>
              </View>
              <Text className="text-sm text-brand-muted leading-5">
                Only hashes stored on-chain. No personal information shared without your consent.
              </Text>
            </View>
          </View>

          <View className="p-5 rounded-2xl bg-brand-light mb-6">
            <Text className="text-sm font-semibold text-brand-black mb-2">
              Built for
            </Text>
            <Text className="text-sm text-brand-muted leading-5">
              Urban commuters, women living alone, elderly parents, students, and anyone 
              who wants an extra layer of safety in their daily life.
            </Text>
          </View>

          <View className="h-8" />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default AboutScreen

