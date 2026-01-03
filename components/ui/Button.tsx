import React from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

type ButtonProps = {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullWidth?: boolean
}

export const Button = ({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
}: ButtonProps) => {
  const baseClasses = 'rounded-2xl items-center justify-center flex-row gap-2'
  
  const variantClasses = {
    primary: 'bg-brand-black active:opacity-90 disabled:opacity-50',
    secondary: 'bg-brand-light active:opacity-80 disabled:opacity-50',
    danger: 'bg-red-600 active:opacity-90 disabled:opacity-50',
    outline: 'bg-white border border-brand-black active:opacity-80 disabled:opacity-50',
  }

  const sizeClasses = {
    sm: 'py-3 px-4 min-h-[44px]',
    md: 'py-4 px-5 min-h-[52px]',
    lg: 'py-5 px-6 min-h-[60px]',
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  const textColorClasses = {
    primary: 'text-brand-white',
    secondary: 'text-brand-black',
    danger: 'text-brand-white',
    outline: 'text-brand-black',
  }

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={combinedClasses}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#000000'}
          size="small"
        />
      ) : (
        <>
          {typeof children === 'string' ? (
            <Text className={`${textSizeClasses[size]} font-semibold ${textColorClasses[variant]}`}>
              {children}
            </Text>
          ) : Array.isArray(children) ? (
            <>
              {children.map((child, index) => {
                if (typeof child === 'string') {
                  return (
                    <Text key={index} className={`${textSizeClasses[size]} font-semibold ${textColorClasses[variant]}`}>
                      {child}
                    </Text>
                  )
                }
                return <React.Fragment key={index}>{child}</React.Fragment>
              })}
            </>
          ) : (
            children
          )}
        </>
      )}
    </Pressable>
  )
}

