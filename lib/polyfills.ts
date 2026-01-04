import { Buffer } from 'buffer'
import { Platform } from 'react-native'

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer
}

if (Platform.OS === 'web') {
  try {
    const cryptoBrowserify = require('crypto-browserify')
    if (typeof global.crypto === 'undefined') {
      global.crypto = cryptoBrowserify
    } else {
      Object.assign(global.crypto, cryptoBrowserify)
    }
  } catch (e) {
    console.warn('Failed to set up crypto polyfill:', e)
  }
}
