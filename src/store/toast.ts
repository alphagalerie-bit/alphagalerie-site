import { create } from 'zustand';
import type { ItemCarrinho } from '../types';

interface ToastState {
  item: ItemCarrinho | null;
  visible: boolean;
  showToast(item: ItemCarrinho): void;
  hideToast(): void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
}

function scheduleItemClear(set: (partial: Partial<ToastState>) => void) {
  clearTimer = setTimeout(() => {
    set({ item: null });
    clearTimer = null;
  }, 300);
}

export const useToastStore = create<ToastState>()((set) => ({
  item: null,
  visible: false,

  showToast(item) {
    clearTimers();
    set({ item, visible: true });
    hideTimer = setTimeout(() => {
      set({ visible: false });
      hideTimer = null;
      scheduleItemClear(set);
    }, 2500);
  },

  hideToast() {
    clearTimers();
    set({ visible: false });
    scheduleItemClear(set);
  },
}));