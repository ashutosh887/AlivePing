import { Platform } from 'react-native'
import * as Battery from 'expo-battery'
import * as Device from 'expo-device'

export interface BatteryInfo {
  batteryLevel: number
  isCharging: boolean
  deviceModel: string
  manufacturer: string
  platform: string
}

const isWeb = Platform.OS === 'web'

export const getBatteryInfo = async (): Promise<BatteryInfo | null> => {
  if (isWeb) {
    return null
  }
  
  try {
    const batteryLevel = await Battery.getBatteryLevelAsync()
    const batteryState = await Battery.getBatteryStateAsync()
    const isCharging = batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL
    
    const deviceModel = Device.modelName || Device.deviceName || 'Unknown Device'
    const manufacturer = Device.manufacturer || 'Unknown'
    const platform = Device.osName || 'Unknown'
    
    return {
      batteryLevel: Math.round(batteryLevel * 100),
      isCharging,
      deviceModel,
      manufacturer,
      platform,
    }
  } catch (error) {
    return null
  }
}

export const subscribeToBatteryUpdates = (
  callback: (info: BatteryInfo | null) => void
): (() => void) => {
  if (isWeb) {
    callback(null)
    return () => {}
  }
  
  const updateBattery = async () => {
    const info = await getBatteryInfo()
    callback(info)
  }
  
  updateBattery()
  
  const levelSubscription = Battery.addBatteryLevelListener(updateBattery)
  const stateSubscription = Battery.addBatteryStateListener(updateBattery)
  
  return () => {
    levelSubscription.remove()
    stateSubscription.remove()
  }
}

