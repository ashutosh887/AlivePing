import { SettingsItem } from '@/components/settings/SettingsItem'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { useAppStore } from '@/lib/store'
import { ArrowLeft, Calendar } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const PrivacySettingsScreen = () => {
  const router = useRouter()
  const privacySettings = useAppStore((s) => s.privacySettings)
  const updatePrivacySettings = useAppStore((s) => s.updatePrivacySettings)

  const retentionOptions = [7, 14, 30, 60, 90]

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
            Privacy & Data
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <SettingsSection title="Data Retention">
            <View className="rounded-2xl bg-white overflow-hidden shadow-sm">
              {retentionOptions.map((days, index) => (
                <React.Fragment key={days}>
                  {index > 0 && <View className="h-px bg-brand-light mx-5" />}
                  <SettingsItem
                    icon={Calendar}
                    title={`${days} days`}
                    subtitle={days === privacySettings.dataRetentionDays ? 'Current setting' : undefined}
                    rightElement={
                      days === privacySettings.dataRetentionDays ? (
                        <View className="w-2.5 h-2.5 rounded-full bg-brand-black" />
                      ) : undefined
                    }
                    onPress={() => updatePrivacySettings({ dataRetentionDays: days })}
                  />
                </React.Fragment>
              ))}
            </View>
          </SettingsSection>

          <View className="p-5 rounded-2xl bg-brand-light mb-6">
            <Text className="text-sm text-brand-muted leading-6">
              Data retention determines how long your check-in and alert history is stored locally. 
              After this period, old data will be automatically deleted.
            </Text>
          </View>

          <View className="h-8" />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default PrivacySettingsScreen

