import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type EventType = "PANIC" | "CHECK_IN";

export type Event = {
  id: string;
  type: EventType;
  timestamp: number;
  status: "triggered";
};

type Store = {
  events: Event[];
  triggerEvent: (type: EventType) => void;
  clearEvents: () => void;
};

export const useAppStore = create<Store>()(
  persist(
    (set) => ({
      events: [],
      triggerEvent: (type) =>
        set((state) => ({
          events: [
            {
              id: crypto.randomUUID(),
              type,
              timestamp: Date.now(),
              status: "triggered",
            },
            ...state.events,
          ],
        })),
      clearEvents: () => set({ events: [] }),
    }),
    {
      name: "aliveping-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
