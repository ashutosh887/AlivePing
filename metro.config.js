const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer'),
  crypto: require.resolve('crypto-browserify'),
}

config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'mjs']

module.exports = withNativeWind(config, { input: './global.css' })

