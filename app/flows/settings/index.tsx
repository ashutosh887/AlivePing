import { SettingsItem } from '@/components/settings/SettingsItem'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { useAppStore } from '@/lib/store'
import { clearWallet } from '@/lib/solana/wallet'
import { useRouter } from 'expo-router'
import { Bell, Info, Lock, LogOut, Shield, Users } from 'lucide-react-native'
import React from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SettingsScreen = () => {
  const router = useRouter()
  const trustedContacts = useAppStore((s) => s.trustedContacts)
  const notificationPreferences = useAppStore((s) => s.notificationPreferences)
  const privacySettings = useAppStore((s) => s.privacySettings)
  const updateNotificationPreferences = useAppStore((s) => s.updateNotificationPreferences)
  const updatePrivacySettings = useAppStore((s) => s.updatePrivacySettings)
  const resetStore = useAppStore((s) => s.resetStore)

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="pt-8 pb-8 px-6">
          <Text className="text-3xl font-bold text-brand-black mb-2">
            Settings
          </Text>
          <Text className="text-base text-brand-muted">
            Manage your preferences
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <SettingsSection title="Contacts">
            <View className="rounded-2xl bg-white overflow-hidden shadow-sm">
              <SettingsItem
                icon={Users}
                title="Trusted Contacts"
                subtitle={`${trustedContacts.length} contact${trustedContacts.length !== 1 ? 's' : ''}`}
                onPress={() => router.push('/flows/contacts')}
                showArrow
              />
            </View>
          </SettingsSection>

          <SettingsSection title="Notifications">
            <View className="rounded-2xl bg-white overflow-hidden shadow-sm">
              <SettingsItem
                icon={Bell}
                title="SMS Alerts"
                subtitle="Send alerts via text message"
                value={notificationPreferences.smsEnabled}
                onToggle={(value) => updateNotificationPreferences({ smsEnabled: value })}
              />
              <View className="h-px bg-brand-light mx-5" />
              <SettingsItem
                title="Push Notifications"
                subtitle="Receive push alerts on device"
                value={notificationPreferences.pushEnabled}
                onToggle={(value) => updateNotificationPreferences({ pushEnabled: value })}
              />
              <View className="h-px bg-brand-light mx-5" />
              <SettingsItem
                title="Email Alerts"
                subtitle="Send alerts via email"
                value={notificationPreferences.emailEnabled}
                onToggle={(value) => updateNotificationPreferences({ emailEnabled: value })}
              />
            </View>
            <View className="mt-3 rounded-2xl bg-white overflow-hidden shadow-sm">
              <SettingsItem
                title="Sound"
                subtitle="Play sound for alerts"
                value={notificationPreferences.soundEnabled}
                onToggle={(value) => updateNotificationPreferences({ soundEnabled: value })}
              />
              <View className="h-px bg-brand-light mx-5" />
              <SettingsItem
                title="Vibration"
                subtitle="Vibrate device for alerts"
                value={notificationPreferences.vibrationEnabled}
                onToggle={(value) => updateNotificationPreferences({ vibrationEnabled: value })}
              />
            </View>
          </SettingsSection>

          <SettingsSection title="Privacy & Data">
            <View className="rounded-2xl bg-white overflow-hidden shadow-sm">
              <SettingsItem
                icon={Shield}
                title="Share Location"
                subtitle="Include location in alerts"
                value={privacySettings.shareLocation}
                onToggle={(value) => updatePrivacySettings({ shareLocation: value })}
              />
              <View className="h-px bg-brand-light mx-5" />
              <SettingsItem
                title="Share Last Seen"
                subtitle="Include last seen time"
                value={privacySettings.shareLastSeen}
                onToggle={(value) => updatePrivacySettings({ shareLastSeen: value })}
              />
              <View className="h-px bg-brand-light mx-5" />
              <SettingsItem
                icon={Lock}
                title="Data Retention"
                subtitle={`${privacySettings.dataRetentionDays} days`}
                onPress={() => router.push('/flows/settings/privacy')}
                showArrow
              />
              <View className="h-px bg-brand-light mx-5" />
              <SettingsItem
                title="Analytics"
                subtitle="Help improve the app"
                value={privacySettings.analyticsEnabled}
                onToggle={(value) => updatePrivacySettings({ analyticsEnabled: value })}
              />
            </View>
          </SettingsSection>

          <SettingsSection title="About">
            <View className="rounded-2xl bg-white overflow-hidden shadow-sm">
              <SettingsItem
                icon={Info}
                title="About AlivePing"
                subtitle="Version 1.0.0"
                onPress={() => router.push('/flows/settings/about')}
                showArrow
              />
            </View>
          </SettingsSection>

          <SettingsSection title="Account">
            <View className="rounded-2xl bg-white overflow-hidden shadow-sm">
              <SettingsItem
                icon={LogOut}
                title="Logout"
                subtitle="Sign out and clear wallet data"
                onPress={() => {
                  Alert.alert(
                    'Logout',
                    'Are you sure you want to logout? This will clear your wallet and all app data.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await clearWallet()
                            resetStore()
                            await AsyncStorage.removeItem('aliveping-store')
                            router.replace('/auth')
                          } catch (error) {
                            console.error('Logout error:', error)
                            Alert.alert('Error', 'Failed to logout. Please try again.')
                          }
                        },
                      },
                    ]
                  )
                }}
                showArrow
              />
            </View>
          </SettingsSection>

          <View className="h-10" />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default SettingsScreen
