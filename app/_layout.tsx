import "@/global.css"
import { DATADOG_EVENTS } from "@/lib/constants/datadog"
import { logEvent } from "@/lib/monitoring/datadog"
import { DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { Buffer } from "buffer"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import "react-native-get-random-values"
global.Buffer = Buffer

export default function RootLayout() {
  useEffect(() => {
    logEvent({
      event: DATADOG_EVENTS.APP_STARTED,
    });
  }, []);

      return (
        <ThemeProvider value={DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="flows" />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      );
    }
