import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { useContacts } from '@/lib/hooks/useContacts'
import * as Haptics from 'expo-haptics'
import { Plus, Star, Trash2, UserPlus, Users } from 'lucide-react-native'
import React, { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
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
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top']}>
      <View className="flex-1">
        <ScreenHeader
          title="Trusted Contacts"
          subtitle="Manage your emergency contacts"
        />

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {showAddForm ? (
            <Card className="mb-6">
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
                <View className="flex-1">
                  <Button
                    onPress={() => {
                      setShowAddForm(false)
                      setNewContactName('')
                      setNewContactPhone('')
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </View>
                
                <View className="flex-1">
                  <Button
                    onPress={handleAddContact}
                  >
                    Add
                  </Button>
                </View>
              </View>
            </Card>
          ) : (
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1">
                <Button
                  onPress={handleImportContacts}
                  disabled={isImporting}
                  loading={isImporting}
                  size="md"
                >
                  <UserPlus size={20} color="#FFFFFF" />
                  Import
                </Button>
              </View>
              
              <View className="flex-1">
                <Button
                  onPress={() => {
                    setShowAddForm(true)
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  }}
                  variant="outline"
                  size="md"
                >
                  <Plus size={20} color="#000000" />
                  Add
                </Button>
              </View>
            </View>
          )}

          {trustedContacts.length === 0 ? (
            <Card className="items-center justify-center py-16">
              <Users size={64} color="#9CA3AF" strokeWidth={1.5} />
              <Text className="mt-6 text-lg font-semibold text-brand-muted">
                No trusted contacts
              </Text>
              <Text className="mt-3 text-sm text-brand-muted text-center px-8 leading-5">
                Add contacts to receive alerts when you need help
              </Text>
            </Card>
          ) : (
            <View className="gap-4">
              {trustedContacts.map((contact) => (
                <Card key={contact.id}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center gap-4">
                      <View className="w-16 h-16 rounded-full bg-brand-accent items-center justify-center">
                        <Text className="text-2xl font-bold text-brand-black">
                          {contact.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      
                      <View className="flex-1">
                        <View className="flex-row items-center gap-3 mb-1.5">
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
                    
                    <View className="flex-row gap-3">
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
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default ContactsScreen
