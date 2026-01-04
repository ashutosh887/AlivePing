import * as Crypto from 'expo-crypto'
import * as Location from 'expo-location'
import { Platform } from 'react-native'
import { requestLocationPermissions as requestLocationPermissionsWeb, getCurrentLocation as getCurrentLocationWeb, getLastKnownLocation as getLastKnownLocationWeb } from '@/lib/utils/locationWeb'

const isWeb = Platform.OS === 'web'

export type LocationSnapshot = {
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: number
}

let locationSubscription: Location.LocationSubscription | null = null

export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    if (isWeb) {
      return await requestLocationPermissionsWeb()
    }
    const { status } = await Location.requestForegroundPermissionsAsync()
    return status === 'granted'
  } catch (error) {
    return false
  }
}

export const getCurrentLocation = async (): Promise<LocationSnapshot | null> => {
  try {
    if (isWeb) {
      return await getCurrentLocationWeb()
    }
    const hasPermission = await requestLocationPermissions()
    if (!hasPermission) {
      return null
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

export const getLastKnownLocation = async (): Promise<LocationSnapshot | null> => {
  try {
    if (isWeb) {
      return await getLastKnownLocationWeb()
    }
    const hasPermission = await requestLocationPermissions()
    if (!hasPermission) {
      return null
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

export const startLocationTracking = async (
  callback: (location: LocationSnapshot) => void
): Promise<boolean> => {
  try {
    const hasPermission = await requestLocationPermissions()
    if (!hasPermission) {
      return false
    }

    if (locationSubscription) {
      locationSubscription.remove()
    }

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000,
        distanceInterval: 100,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        })
      }
    )

    return true
  } catch (error) {
    return false
  }
}

export const stopLocationTracking = () => {
  if (locationSubscription) {
    locationSubscription.remove()
    locationSubscription = null
  }
}

export const hashLocation = async (location: LocationSnapshot): Promise<number[]> => {
  try {
    const locationString = `${location.latitude},${location.longitude},${location.timestamp}`
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      locationString
    )
    const hashBytes = new Uint8Array(digest.length / 2)
    for (let i = 0; i < digest.length; i += 2) {
      hashBytes[i / 2] = parseInt(digest.substr(i, 2), 16)
    }
    return Array.from(hashBytes)
  } catch (error) {
    return new Array(32).fill(0)
  }
}

