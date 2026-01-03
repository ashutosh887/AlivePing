import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { generateUUID } from "./utils";

export type EventType = "PANIC" | "CHECK_IN" | "ALERT";

export type Event = {
  id: string;
  type: EventType;
  timestamp: number;
  status: "triggered" | "confirmed" | "cancelled";
  checkInTime?: number;
  alertTime?: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  };
};

export type CheckInState = {
  isActive: boolean;
  startTime: number;
  checkInTime: number;
  graceWindowEnd?: number;
};

export type ScheduledCheckIn = {
  id: string;
  name: string;
  time: string;
  days: number[];
  isActive: boolean;
  duration: number;
};

export type TrustedContact = {
  id: string;
  name: string;
  phone: string;
  isPrimary: boolean;
};

export type NotificationPreferences = {
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

export type PrivacySettings = {
  shareLocation: boolean;
  shareLastSeen: boolean;
  dataRetentionDays: number;
  analyticsEnabled: boolean;
};

type Store = {
  events: Event[];
  checkIn: CheckInState | null;
  trustedContacts: TrustedContact[];
  scheduledCheckIns: ScheduledCheckIn[];
  notificationPreferences: NotificationPreferences;
  privacySettings: PrivacySettings;
  startCheckIn: (location?: { latitude: number; longitude: number; accuracy: number | null }) => void;
  confirmCheckIn: () => void;
  cancelCheckIn: () => void;
  triggerAlert: (location?: { latitude: number; longitude: number; accuracy: number | null }) => void;
  cancelAlert: () => void;
  triggerPanic: (location?: { latitude: number; longitude: number; accuracy: number | null }) => void;
  clearEvents: () => void;
  addTrustedContact: (contact: Omit<TrustedContact, "id">) => void;
  removeTrustedContact: (id: string) => void;
  updateTrustedContact: (id: string, updates: Partial<TrustedContact>) => void;
  setPrimaryContact: (id: string) => void;
  addScheduledCheckIn: (checkIn: Omit<ScheduledCheckIn, "id">) => void;
  removeScheduledCheckIn: (id: string) => void;
  updateScheduledCheckIn: (id: string, updates: Partial<ScheduledCheckIn>) => void;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  resetStore: () => void;
};

const CHECK_IN_DURATION_MS = 5 * 60 * 1000;
const GRACE_WINDOW_MS = 2 * 60 * 1000;

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      events: [],
      checkIn: null,
      trustedContacts: [],
      scheduledCheckIns: [],
      notificationPreferences: {
        smsEnabled: true,
        pushEnabled: true,
        emailEnabled: false,
        soundEnabled: true,
        vibrationEnabled: true,
      },
      privacySettings: {
        shareLocation: true,
        shareLastSeen: true,
        dataRetentionDays: 30,
        analyticsEnabled: false,
      },

      startCheckIn: (location?: { latitude: number; longitude: number; accuracy: number | null }) => {
        const now = Date.now();
        const checkInTime = now + CHECK_IN_DURATION_MS;
        set({
          checkIn: {
            isActive: true,
            startTime: now,
            checkInTime,
          },
          events: [
            {
              id: generateUUID(),
              type: "CHECK_IN",
              timestamp: now,
              status: "triggered",
              checkInTime,
              location,
            },
            ...get().events,
          ],
        });
      },

      confirmCheckIn: () => {
        const { checkIn, events } = get();
        if (!checkIn) return;

        const activeEvent = events.find(e => e.type === "CHECK_IN" && e.status === "triggered" && e.checkInTime === checkIn.checkInTime);
        
        set((state) => ({
          events: state.events.map(event => 
            event.id === activeEvent?.id 
              ? { ...event, status: "confirmed" as const }
              : event
          ),
          checkIn: null,
        }));
      },

      cancelCheckIn: () => {
        set({ checkIn: null });
      },

      triggerAlert: (location?: { latitude: number; longitude: number; accuracy: number | null }) => {
        const { checkIn, events } = get();
        const now = Date.now();
        const graceWindowEnd = now + GRACE_WINDOW_MS;
        
        const activeEvent = events.find(e => e.type === "CHECK_IN" && e.status === "triggered");

        set((state) => ({
          events: state.events.map(event => 
            event.id === activeEvent?.id 
              ? { ...event, status: "triggered" as const, alertTime: now, location: location || event.location }
              : event
          ),
          checkIn: checkIn
            ? {
                ...checkIn,
                graceWindowEnd,
              }
            : null,
        }));
      },

      cancelAlert: () => {
        const { checkIn } = get();
        if (!checkIn?.graceWindowEnd) return;

        const now = Date.now();
        if (now > checkIn.graceWindowEnd) {
          return;
        }

        set((state) => ({
          events: [
            {
              id: generateUUID(),
              type: "ALERT",
              timestamp: now,
              status: "cancelled",
            },
            ...state.events,
          ],
          checkIn: null,
        }));
      },

      clearEvents: () => set({ events: [] }),

      addTrustedContact: (contact) =>
        set((state) => ({
          trustedContacts: [
            ...state.trustedContacts,
            {
              ...contact,
              id: generateUUID(),
            },
          ],
        })),

      removeTrustedContact: (id) =>
        set((state) => ({
          trustedContacts: state.trustedContacts.filter((c) => c.id !== id),
        })),

      updateTrustedContact: (id, updates) =>
        set((state) => ({
          trustedContacts: state.trustedContacts.map((contact) =>
            contact.id === id ? { ...contact, ...updates } : contact
          ),
        })),

      setPrimaryContact: (id) =>
        set((state) => ({
          trustedContacts: state.trustedContacts.map((contact) => ({
            ...contact,
            isPrimary: contact.id === id,
          })),
        })),

      updateNotificationPreferences: (prefs) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            ...prefs,
          },
        })),

      updatePrivacySettings: (settings) =>
        set((state) => ({
          privacySettings: {
            ...state.privacySettings,
            ...settings,
          },
        })),

      triggerPanic: (location?: { latitude: number; longitude: number; accuracy: number | null }) => {
        const now = Date.now();
        set((state) => ({
          events: [
            {
              id: generateUUID(),
              type: "PANIC",
              timestamp: now,
              status: "triggered",
              location,
            },
            ...state.events,
          ],
        }));
      },

      addScheduledCheckIn: (checkIn) =>
        set((state) => ({
          scheduledCheckIns: [
            ...state.scheduledCheckIns,
            {
              ...checkIn,
              id: generateUUID(),
            },
          ],
        })),

      removeScheduledCheckIn: (id) =>
        set((state) => ({
          scheduledCheckIns: state.scheduledCheckIns.filter((c) => c.id !== id),
        })),

      updateScheduledCheckIn: (id, updates) =>
        set((state) => ({
          scheduledCheckIns: state.scheduledCheckIns.map((checkIn) =>
            checkIn.id === id ? { ...checkIn, ...updates } : checkIn
          ),
        })),

      resetStore: () =>
        set({
          events: [],
          checkIn: null,
          trustedContacts: [],
          scheduledCheckIns: [],
          notificationPreferences: {
            smsEnabled: true,
            pushEnabled: true,
            emailEnabled: false,
            soundEnabled: true,
            vibrationEnabled: true,
          },
          privacySettings: {
            shareLocation: true,
            shareLastSeen: true,
            dataRetentionDays: 30,
            analyticsEnabled: false,
          },
        }),
    }),
    {
      name: "aliveping-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
