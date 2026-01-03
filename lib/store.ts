import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const generateUUID = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
};

export type EventType = "PANIC" | "CHECK_IN" | "ALERT";

export type Event = {
  id: string;
  type: EventType;
  timestamp: number;
  status: "triggered" | "confirmed" | "cancelled";
  checkInTime?: number;
  alertTime?: number;
};

export type CheckInState = {
  isActive: boolean;
  startTime: number;
  checkInTime: number;
  graceWindowEnd?: number;
};

type TrustedContact = {
  id: string;
  name: string;
  phone: string;
  isPrimary: boolean;
};

type Store = {
  events: Event[];
  checkIn: CheckInState | null;
  trustedContacts: TrustedContact[];
  startCheckIn: () => void;
  confirmCheckIn: () => void;
  cancelCheckIn: () => void;
  triggerAlert: () => void;
  cancelAlert: () => void;
  clearEvents: () => void;
  addTrustedContact: (contact: Omit<TrustedContact, "id">) => void;
  removeTrustedContact: (id: string) => void;
};

const CHECK_IN_DURATION_MS = 5 * 60 * 1000;
const GRACE_WINDOW_MS = 2 * 60 * 1000;

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      events: [],
      checkIn: null,
      trustedContacts: [
        {
          id: "default-1",
          name: "Emergency Contact",
          phone: "+1234567890",
          isPrimary: true,
        },
      ],

      startCheckIn: () => {
        const now = Date.now();
        const checkInTime = now + CHECK_IN_DURATION_MS;
        set({
          checkIn: {
            isActive: true,
            startTime: now,
            checkInTime,
          },
        });
      },

      confirmCheckIn: () => {
        const { checkIn } = get();
        if (!checkIn) return;

        set((state) => ({
          events: [
            {
              id: generateUUID(),
              type: "CHECK_IN",
              timestamp: Date.now(),
              status: "confirmed",
              checkInTime: checkIn.checkInTime,
            },
            ...state.events,
          ],
          checkIn: null,
        }));
      },

      cancelCheckIn: () => {
        set({ checkIn: null });
      },

      triggerAlert: () => {
        const { checkIn } = get();
        const now = Date.now();
        const graceWindowEnd = now + GRACE_WINDOW_MS;

        set((state) => ({
          events: [
            {
              id: generateUUID(),
              type: "ALERT",
              timestamp: now,
              status: "triggered",
              checkInTime: checkIn?.checkInTime,
              alertTime: now,
            },
            ...state.events,
          ],
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
    }),
    {
      name: "aliveping-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
