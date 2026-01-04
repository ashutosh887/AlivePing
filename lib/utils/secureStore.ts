import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const isWeb = Platform.OS === 'web'

const getStorageKey = (key: string): string => {
  return `aliveping_${key}`
}

export const secureStoreGetItemAsync = async (key: string): Promise<string | null> => {
  try {
    if (isWeb) {
      const value = localStorage.getItem(getStorageKey(key))
      return value
    }
    return await SecureStore.getItemAsync(key)
  } catch (error) {
    return null
  }
}

export const secureStoreSetItemAsync = async (key: string, value: string): Promise<void> => {
  try {
    if (isWeb) {
      localStorage.setItem(getStorageKey(key), value)
      return
    }
    await SecureStore.setItemAsync(key, value)
  } catch (error) {
  }
}

export const secureStoreDeleteItemAsync = async (key: string): Promise<void> => {
  try {
    if (isWeb) {
      localStorage.removeItem(getStorageKey(key))
      return
    }
    await SecureStore.deleteItemAsync(key)
  } catch (error) {
  }
}

