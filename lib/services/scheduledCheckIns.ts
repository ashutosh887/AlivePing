import { ScheduledCheckIn } from '@/lib/store'
import * as Notifications from 'expo-notifications'

export const scheduleCheckInNotification = async (
  scheduledCheckIn: ScheduledCheckIn,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): Promise<string | null> => {
  try {
    const [hours, minutes] = scheduledCheckIn.time.split(':').map(Number)
    
    const now = new Date()
    const today = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    
    let targetDate = new Date(today)
    targetDate.setHours(hours, minutes, 0, 0)
    
    if (targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 1)
    }
    
    let daysToAdd = 0
    const currentDay = targetDate.getDay()
    const sortedDays = [...scheduledCheckIn.days].sort((a, b) => a - b)
    
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7
      if (scheduledCheckIn.days.includes(checkDay)) {
        daysToAdd = i
        break
      }
    }
    
    if (daysToAdd === 0 && !scheduledCheckIn.days.includes(currentDay)) {
      const nextDay = sortedDays.find(day => day > currentDay) || sortedDays[0]
      daysToAdd = nextDay > currentDay ? nextDay - currentDay : (7 - currentDay) + nextDay
    }
    
    targetDate.setDate(targetDate.getDate() + daysToAdd)
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Check-In Reminder',
        body: `Time for your scheduled check-in: ${scheduledCheckIn.name}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: targetDate,
        timezone,
      },
    })
    
    return notificationId
  } catch (error) {
    console.error('Error scheduling check-in notification:', error)
    return null
  }
}

export const cancelScheduledCheckInNotification = async (notificationId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  } catch (error) {
    console.error('Error canceling scheduled check-in notification:', error)
  }
}

export const getTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
