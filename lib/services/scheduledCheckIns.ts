import { ScheduledCheckIn } from '@/lib/store'
import { scheduleNotificationAsync, cancelScheduledNotificationAsync } from '@/lib/utils/notificationsWeb'

const IST_TIMEZONE = 'Asia/Kolkata'

export const getNextScheduledTime = (scheduledCheckIn: ScheduledCheckIn): Date | null => {
  try {
    const [hours, minutes] = scheduledCheckIn.time.split(':').map(Number)
    
    const now = new Date()
    const nowIST = new Date(now.toLocaleString('en-US', { timeZone: IST_TIMEZONE }))
    
    let targetDate = new Date(nowIST)
    targetDate.setHours(hours, minutes, 0, 0)
    
    if (targetDate <= nowIST) {
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
    
    return targetDate
  } catch (error) {
    return null
  }
}

export const scheduleCheckInNotification = async (
  scheduledCheckIn: ScheduledCheckIn,
  timezone: string = IST_TIMEZONE
): Promise<string | null> => {
  try {
    const targetDate = getNextScheduledTime(scheduledCheckIn)
    if (!targetDate) {
      return null
    }
    
    const notificationId = await scheduleNotificationAsync({
      content: {
        title: 'Check-In Reminder',
        body: `Time for your scheduled check-in: ${scheduledCheckIn.name}`,
        sound: true,
      },
      trigger: {
        date: targetDate,
        timezone,
      },
    })
    
    return notificationId
  } catch (error) {
    return null
  }
}

export const cancelScheduledCheckInNotification = async (notificationId: string) => {
  try {
    await cancelScheduledNotificationAsync(notificationId)
  } catch (error) {
  }
}

export const getTimezone = (): string => {
  return IST_TIMEZONE
}

export const formatTimeIST = (date: Date): string => {
  return date.toLocaleTimeString('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export const formatDateIST = (date: Date): string => {
  const today = new Date()
  const todayIST = new Date(today.toLocaleString('en-US', { timeZone: IST_TIMEZONE }))
  const dateIST = new Date(date.toLocaleString('en-US', { timeZone: IST_TIMEZONE }))
  
  const diffTime = dateIST.getTime() - todayIST.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Tomorrow'
  } else if (diffDays === -1) {
    return 'Yesterday'
  } else if (diffDays < 7 && diffDays > -7) {
    return dateIST.toLocaleDateString('en-IN', { weekday: 'short' })
  } else {
    return dateIST.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: dateIST.getFullYear() !== todayIST.getFullYear() ? 'numeric' : undefined,
    })
  }
}
