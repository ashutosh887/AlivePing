import { useContacts } from '@/lib/hooks/useContacts'
import * as Haptics from 'expo-haptics'
import { Plus, Star, Trash2, UserPlus, Users } from 'lucide-react-native'
import React, { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const ContactsScreen = () => {
  const {
    trustedContacts,
    isImporting,
    importFromDevice,
    addContact,
    removeContact,
    setPrimaryContact,
  } = useContacts()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  const handleImportContacts = async () => {
    try {
      const contacts = await importFromDevice()
      
      if (contacts.length === 0) {
        Alert.alert('No Contacts', 'No contacts with phone numbers found.')
        return
      }

      Alert.alert(
        'Import Contacts',
        `Found ${contacts.length} contacts. Select which ones to add as trusted contacts.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add All',
            onPress: () => {
              contacts.forEach((contact) => {
                if (contact.phone) {
                  addContact({
                    name: contact.name,
                    phone: contact.phone,
                    isPrimary: false,
                  })
                }
              })
              Alert.alert('Success', `Added ${contacts.length} contacts`)
            },
          },
        ]
      )
    } catch (error: any) {
      Alert.alert(
        'Import Failed',
        error.message || 'Unable to import contacts. Please check permissions.'
      )
    }
  }

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Invalid Input', 'Please enter both name and phone number.')
      return
    }

    addContact({
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      isPrimary: trustedContacts.length === 0,
    })

    setNewContactName('')
    setNewContactPhone('')
    setShowAddForm(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const handleRemoveContact = (id: string, name: string) => {
    Alert.alert(
      'Remove Contact',
      `Are you sure you want to remove ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeContact(id)
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="pt-8 pb-8 px-6">
          <Text className="text-3xl font-bold text-brand-black mb-2">
            Trusted Contacts
          </Text>
          <Text className="text-base text-brand-muted">
            Manage your emergency contacts
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {showAddForm ? (
            <View className="mb-6 p-6 rounded-2xl bg-white shadow-sm">
              <Text className="text-lg font-semibold text-brand-black mb-5">
                Add New Contact
              </Text>
              
              <TextInput
                placeholder="Name"
                value={newContactName}
                onChangeText={setNewContactName}
                className="mb-4 px-4 py-3.5 rounded-xl bg-brand-light text-brand-black text-base"
                placeholderTextColor="#9CA3AF"
              />
              
              <TextInput
                placeholder="Phone Number"
                value={newContactPhone}
                onChangeText={setNewContactPhone}
                keyboardType="phone-pad"
                className="mb-5 px-4 py-3.5 rounded-xl bg-brand-light text-brand-black text-base"
                placeholderTextColor="#9CA3AF"
              />
              
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setShowAddForm(false)
                    setNewContactName('')
                    setNewContactPhone('')
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-brand-light active:opacity-80"
                >
                  <Text className="text-center text-brand-black font-semibold text-base">
                    Cancel
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={handleAddContact}
                  className="flex-1 py-3.5 rounded-xl bg-brand-black active:opacity-90"
                >
                  <Text className="text-center text-brand-white font-semibold text-base">
                    Add
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="flex-row gap-3 mb-6">
              <Pressable
                onPress={handleImportContacts}
                disabled={isImporting}
                className="flex-1 py-4 rounded-2xl bg-brand-black active:opacity-90 disabled:opacity-50 flex-row items-center justify-center gap-2 shadow-lg"
              >
                {isImporting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <UserPlus size={20} color="#FFFFFF" />
                    <Text className="text-brand-white font-semibold text-base">
                      Import
                    </Text>
                  </>
                )}
              </Pressable>
              
              <Pressable
                onPress={() => {
                  setShowAddForm(true)
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }}
                className="flex-1 py-4 rounded-2xl bg-white border-2 border-brand-black active:opacity-80 flex-row items-center justify-center gap-2 shadow-sm"
              >
                <Plus size={20} color="#000000" />
                <Text className="text-brand-black font-semibold text-base">
                  Add
                </Text>
              </Pressable>
            </View>
          )}

          {trustedContacts.length === 0 ? (
            <View className="items-center justify-center py-16 rounded-2xl bg-white shadow-sm">
              <Users size={64} color="#9CA3AF" strokeWidth={1.5} />
              <Text className="mt-6 text-lg font-semibold text-brand-muted">
                No trusted contacts
              </Text>
              <Text className="mt-3 text-sm text-brand-muted text-center px-8 leading-5">
                Add contacts to receive alerts when you need help
              </Text>
            </View>
          ) : (
            <View className="gap-4 pb-8">
              {trustedContacts.map((contact) => (
                <View
                  key={contact.id}
                  className="p-5 rounded-2xl bg-white shadow-sm"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center gap-4">
                      <View className="w-16 h-16 rounded-full bg-brand-accent items-center justify-center shadow-sm">
                        <Text className="text-2xl font-bold text-brand-black">
                          {contact.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2.5 mb-1.5">
                          <Text className="text-lg font-semibold text-brand-black">
                            {contact.name}
                          </Text>
                          {contact.isPrimary && (
                            <Star size={18} color="#000000" fill="#000000" />
                          )}
                        </View>
                        <Text className="text-sm text-brand-muted">
                          {contact.phone}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row gap-2.5">
                      {!contact.isPrimary && (
                        <Pressable
                          onPress={() => {
                            setPrimaryContact(contact.id)
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                          }}
                          className="p-3 rounded-xl bg-brand-light active:opacity-80"
                        >
                          <Star size={18} color="#000000" />
                        </Pressable>
                      )}
                      
                      <Pressable
                        onPress={() => handleRemoveContact(contact.id, contact.name)}
                        className="p-3 rounded-xl bg-red-50 active:opacity-80"
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default ContactsScreen
