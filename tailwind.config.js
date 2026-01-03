/** @type {import('tailwindcss').Config} */
let nativewindPreset;
let presetLoaded = false;

try {
  nativewindPreset = require("nativewind/preset");
  presetLoaded = true;
} catch (e) {
}

const config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          white: "#FFFFFF",
          black: "#000000",
          dark: "#1C1C1C",
          muted: "#9CA3AF",
          light: "#E5E7EB",
          accent: "#FADADD",
        },
      },
    },
  },
  plugins: [],
};

// Only add preset if it was successfully loaded
if (presetLoaded && nativewindPreset) {
  config.presets = [nativewindPreset];
}

module.exports = config;
