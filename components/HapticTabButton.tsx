import * as Haptics from 'expo-haptics'
import { ComponentProps, forwardRef } from 'react'
import { Pressable } from 'react-native'

const HapticTabButton = forwardRef<any, ComponentProps<typeof Pressable> & { children?: React.ReactNode }>(
  (props, ref) => {
    const { onPress, accessibilityState, children, ...restProps } = props
    const focused = accessibilityState?.selected

    return (
      <Pressable
        {...restProps}
        ref={ref}
        accessibilityState={accessibilityState}
        onPress={(e) => {
          Haptics.impactAsync(
            focused
              ? Haptics.ImpactFeedbackStyle.Light
              : Haptics.ImpactFeedbackStyle.Medium
          )

          onPress?.(e)
        }}
      >
        {children}
      </Pressable>
    )
  }
)

HapticTabButton.displayName = 'HapticTabButton'

export default HapticTabButton

