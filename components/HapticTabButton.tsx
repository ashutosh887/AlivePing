import * as Haptics from 'expo-haptics'
import { Pressable } from 'react-native'

export default function HapticTabButton(props: any) {
  const { onPress, accessibilityState } = props
  const focused = accessibilityState?.selected

  return (
    <Pressable
      {...props}
      onPress={(e) => {
        Haptics.impactAsync(
          focused
            ? Haptics.ImpactFeedbackStyle.Light
            : Haptics.ImpactFeedbackStyle.Medium
        )

        onPress?.(e)
      }}
    />
  )
}

