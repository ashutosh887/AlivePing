import { Platform } from 'react-native'
import * as Location from 'expo-location'

const isWeb = Platform.OS === 'web'

export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    if (isWeb) {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(false)
          return
        }
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        )
      })
    }
    const { status } = await Location.requestForegroundPermissionsAsync()
    return status === 'granted'
  } catch (error) {
    return false
  }
}

export const getCurrentLocation = async (): Promise<{
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: number
} | null> => {
  try {
    if (isWeb) {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null)
          return
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            })
          },
          () => resolve(null),
          { timeout: 10000, enableHighAccuracy: false }
        )
      })
    }
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    }
  } catch (error) {
    return null
  }
}

export const getLastKnownLocation = async (): Promise<{
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: number
} | null> => {
  try {
    if (isWeb) {
      return getCurrentLocation()
    }
    const location = await Location.getLastKnownPositionAsync({
      maxAge: 300000,
      requiredAccuracy: 100,
    })
    if (!location) {
      return null
    }
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    }
  } catch (error) {
    return null
  }
}

