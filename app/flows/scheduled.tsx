import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { useAppStore, ScheduledCheckIn } from '@/lib/store'
import { scheduleCheckInNotification, cancelScheduledCheckInNotification, getTimezone, getNextScheduledTime, formatTimeIST, formatDateIST } from '@/lib/services/scheduledCheckIns'
import * as Haptics from 'expo-haptics'
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NUMBERS = [0, 1, 2, 3, 4, 5, 6]

const IST_TIMEZONE = 'Asia/Kolkata'

const ScheduledCheckInsScreen = () => {
  const scheduledCheckIns = useAppStore((s) => s.scheduledCheckIns)
  const appSettings = useAppStore((s) => s.appSettings)
  const addScheduledCheckIn = useAppStore((s) => s.addScheduledCheckIn)
  const removeScheduledCheckIn = useAppStore((s) => s.removeScheduledCheckIn)
  const updateScheduledCheckIn = useAppStore((s) => s.updateScheduledCheckIn)
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [time, setTime] = useState(() => {
    const now = new Date()
    const nowIST = new Date(now.toLocaleString('en-US', { timeZone: IST_TIMEZONE }))
    const hours = nowIST.getHours().toString().padStart(2, '0')
    const minutes = nowIST.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  })
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    const now = new Date()
    const nowIST = new Date(now.toLocaleString('en-US', { timeZone: IST_TIMEZONE }))
    return [nowIST.getDay()]
  })
  const [duration, setDuration] = useState(appSettings.checkInDurationMinutes.toString())

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert('Invalid Input', 'Please enter a name for the scheduled check-in.')
      return
    }
    if (!time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      Alert.alert('Invalid Time', 'Please enter a valid time in HH:MM format (24-hour).')
      return
    }
    if (selectedDays.length === 0) {
      Alert.alert('Invalid Input', 'Please select at least one day.')
      return
    }
    const durationNum = parseInt(duration, 10)
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 60) {
      Alert.alert('Invalid Duration', 'Please enter a duration between 1 and 60 minutes.')
      return
    }

    const newCheckIn: Omit<ScheduledCheckIn, 'id'> = {
      name: name.trim(),
      time,
      days: [...selectedDays].sort((a, b) => a - b),
      isActive: true,
      duration: durationNum,
    }

    addScheduledCheckIn(newCheckIn)

    const addedCheckIn = scheduledCheckIns.find(
      sc => sc.name === newCheckIn.name && sc.time === newCheckIn.time
    ) || { ...newCheckIn, id: '' }

    scheduleCheckInNotification({ ...newCheckIn, id: addedCheckIn.id }, getTimezone())

    setName('')
    setTime('')
    setSelectedDays([])
    setDuration(appSettings.checkInDurationMinutes.toString())
    setShowAddForm(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const handleRemove = (id: string, name: string) => {
    Alert.alert(
      'Remove Scheduled Check-In',
      `Are you sure you want to remove "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeScheduledCheckIn(id)
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          },
        },
      ]
    )
  }

  const handleToggleActive = async (checkIn: ScheduledCheckIn) => {
    const updated = { ...checkIn, isActive: !checkIn.isActive }
    updateScheduledCheckIn(checkIn.id, { isActive: updated.isActive })

    if (updated.isActive) {
      await scheduleCheckInNotification(updated, getTimezone())
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top']}>
      <View className="flex-1">
        <ScreenHeader
          title="Scheduled Check-Ins"
          subtitle="Automate your safety check-ins"
        />

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {showAddForm ? (
            <Card className="mb-6">
              <Text className="text-lg font-semibold text-brand-black mb-5">
                New Scheduled Check-In
              </Text>

              <TextInput
                placeholder="Name (e.g., Morning Commute)"
                value={name}
                onChangeText={setName}
                className="mb-4 px-4 py-3.5 rounded-xl bg-brand-light text-brand-black text-base"
                placeholderTextColor="#9CA3AF"
              />

              <TextInput
                placeholder="Time (HH:MM, 24-hour)"
                value={time}
                onChangeText={setTime}
                keyboardType="default"
                className="mb-4 px-4 py-3.5 rounded-xl bg-brand-light text-brand-black text-base"
                placeholderTextColor="#9CA3AF"
              />

              <TextInput
                placeholder="Duration (minutes, 1-60)"
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                className="mb-4 px-4 py-3.5 rounded-xl bg-brand-light text-brand-black text-base"
                placeholderTextColor="#9CA3AF"
              />

              <Text className="text-sm font-semibold text-brand-black mb-3">Days of Week</Text>
              <View className="flex-row flex-wrap gap-2 mb-5">
                {DAY_NUMBERS.map(day => (
                  <Button
                    key={day}
                    onPress={() => toggleDay(day)}
                    variant={selectedDays.includes(day) ? 'default' : 'outline'}
                    size="sm"
                    className={selectedDays.includes(day) ? '' : 'bg-transparent'}
                  >
                    {DAYS[day]}
                  </Button>
                ))}
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    onPress={() => {
                      setShowAddForm(false)
                      setName('')
                      setTime('')
                      setSelectedDays([])
                      setDuration(appSettings.checkInDurationMinutes.toString())
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </View>
                <View className="flex-1">
                  <Button onPress={handleAdd}>
                    Add
                  </Button>
                </View>
              </View>
            </Card>
          ) : (
            <View className="mb-6">
              <Button
                onPress={() => {
                  setShowAddForm(true)
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }}
                size="md"
              >
                <Plus size={20} color="#FFFFFF" />
                Add Scheduled Check-In
              </Button>
            </View>
          )}

          {scheduledCheckIns.length === 0 ? (
            <Card className="items-center justify-center py-16">
              <Calendar size={64} color="#9CA3AF" strokeWidth={1.5} />
              <Text className="mt-6 text-lg font-semibold text-brand-muted">
                No scheduled check-ins
              </Text>
              <Text className="mt-3 text-sm text-brand-muted text-center px-8 leading-5">
                Create scheduled check-ins to automatically remind you at specific times
              </Text>
            </Card>
          ) : (
            <View className="gap-4">
              {scheduledCheckIns.map((checkIn) => {
                const nextTime = getNextScheduledTime(checkIn)
                const nextTimeFormatted = nextTime ? formatTimeIST(nextTime) : checkIn.time
                const nextDateFormatted = nextTime ? formatDateIST(nextTime) : ''
                
                return (
                  <Card key={checkIn.id}>
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-brand-black">
                          {checkIn.name}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <Clock size={14} color="#6B7280" />
                          <Text className="text-sm text-brand-muted">
                            {checkIn.time} IST • {checkIn.duration} min
                          </Text>
                        </View>
                        {nextTime && checkIn.isActive && (
                          <View className="flex-row items-center gap-1.5 mt-1.5">
                            <Calendar size={12} color="#10B981" />
                            <Text className="text-xs font-medium text-green-600">
                              Next: {nextDateFormatted} at {nextTimeFormatted}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Switch
                        value={checkIn.isActive}
                        onValueChange={() => handleToggleActive(checkIn)}
                        trackColor={{ false: '#D1D5DB', true: '#000000' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    <View className="flex-row flex-wrap gap-2 mb-3">
                      {checkIn.days.map(day => (
                        <View
                          key={day}
                          className="px-2.5 py-1 rounded-full bg-brand-accent"
                        >
                          <Text className="text-xs font-medium text-brand-black">
                            {DAYS[day]}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View className="flex-row justify-end">
                      <Button
                        onPress={() => handleRemove(checkIn.id, checkIn.name)}
                        variant="outline"
                        size="sm"
                        className="bg-red-50 border-red-200"
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </Button>
                    </View>
                  </Card>
                )
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default ScheduledCheckInsScreen

