import { StorageApi } from "../types.ts";

/**
 * Default StorageAPI implementation using `localStorage`.
 * It gracefully handles environments where `localStorage` might not be available (e.g., SSR).
 */
export const localStorageStore: StorageApi = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (error) {
      console.error("localStorage.getItem failed:", error);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error("localStorage.setItem failed:", error);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error("localStorage.removeItem failed:", error);
    }
  },
};
