import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

const isWeb = Platform.OS === 'web'

export const scheduleNotificationAsync = async (
  options: Notifications.NotificationRequestInput
): Promise<string | null> => {
  try {
    if (isWeb) {
      return null
    }
    return await Notifications.scheduleNotificationAsync(options)
  } catch (error) {
    return null
  }
}

export const cancelScheduledNotificationAsync = async (notificationId: string): Promise<void> => {
  try {
    if (isWeb) {
      return
    }
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  } catch (error) {
  }
}

