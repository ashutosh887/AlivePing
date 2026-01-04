import { useAppStore, TrustedContact } from '@/lib/store'
import { logEvent } from '@/lib/monitoring/datadog'
import { DATADOG_EVENTS } from '@/lib/constants/datadog'
import { useState } from 'react'
import { Platform } from 'react-native'

export const useContacts = () => {
  const trustedContacts = useAppStore((s) => s.trustedContacts)
  const addTrustedContact = useAppStore((s) => s.addTrustedContact)
  const removeTrustedContact = useAppStore((s) => s.removeTrustedContact)
  const updateTrustedContact = useAppStore((s) => s.updateTrustedContact)
  const setPrimaryContact = useAppStore((s) => s.setPrimaryContact)
  const [isImporting, setIsImporting] = useState(false)

  const importFromDevice = async () => {
    setIsImporting(true)
    try {
      if (Platform.OS === 'web') {
        throw new Error('Contact import not available on web')
      }
      const { requestPermissionsAsync, getContactsAsync, Fields } = await import('expo-contacts')
      
      const { status } = await requestPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Permission denied')
      }

      const { data } = await getContactsAsync({
        fields: [Fields.Name, Fields.PhoneNumbers],
      })

      const contactsWithPhones = data.filter(
        (contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0
      )

      const contacts = contactsWithPhones.map((contact) => ({
        name: contact.name || 'Unknown',
        phone: contact.phoneNumbers?.[0]?.number || '',
      }))

      await logEvent({
        event: DATADOG_EVENTS.CONTACT_IMPORTED,
        payload: {
          count: contacts.length,
        },
      })

      return contacts
    } catch (error) {
      throw error
    } finally {
      setIsImporting(false)
    }
  }

  const addContact = async (contact: Omit<TrustedContact, 'id'>) => {
    addTrustedContact(contact)
    await logEvent({
      event: DATADOG_EVENTS.CONTACT_ADDED,
      payload: {
        name: contact.name,
      },
    })
  }

  const removeContact = async (id: string) => {
    const contact = trustedContacts.find(c => c.id === id)
    removeTrustedContact(id)
    if (contact) {
      await logEvent({
        event: DATADOG_EVENTS.CONTACT_REMOVED,
        payload: {
          name: contact.name,
        },
      })
    }
  }

  const updateContact = (id: string, updates: Partial<TrustedContact>) => {
    updateTrustedContact(id, updates)
  }

  const handleSetPrimary = async (id: string) => {
    setPrimaryContact(id)
    await logEvent({
      event: DATADOG_EVENTS.CONTACT_SET_PRIMARY,
      payload: {
        contactId: id,
      },
    })
  }

  return {
    trustedContacts,
    isImporting,
    importFromDevice,
    addContact,
    removeContact,
    updateContact,
    setPrimaryContact: handleSetPrimary,
  }
}

