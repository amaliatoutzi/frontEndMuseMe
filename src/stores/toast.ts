import { defineStore } from 'pinia';

export type ToastKind = 'success' | 'error' | 'info';
export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  timeout: number; // ms
}

let nextId = 1;

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [] as ToastItem[],
  }),
  actions: {
    show(message: string, kind: ToastKind = 'info', timeout = 3000) {
      const id = nextId++;
      const item: ToastItem = { id, kind, message, timeout };
      this.items.push(item);
      // Auto-dismiss
      window.setTimeout(() => this.dismiss(id), timeout);
      return id;
    },
    success(message: string, timeout = 3000) { return this.show(message, 'success', timeout); },
    error(message: string, timeout = 4000) { return this.show(message, 'error', timeout); },
    info(message: string, timeout = 3000) { return this.show(message, 'info', timeout); },
    dismiss(id: number) {
      const idx = this.items.findIndex((t) => t.id === id);
      if (idx >= 0) this.items.splice(idx, 1);
    },
    clear() { this.items = []; },
  },
});
