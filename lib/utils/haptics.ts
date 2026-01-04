import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

export const hapticImpact = async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
  if (Platform.OS === 'web') {
    return
  }
  try {
    await Haptics.impactAsync(style)
  } catch {
  }
}

export const hapticNotification = async (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
  if (Platform.OS === 'web') {
    return
  }
  try {
    await Haptics.notificationAsync(type)
  } catch {
  }
}

export { Haptics }

