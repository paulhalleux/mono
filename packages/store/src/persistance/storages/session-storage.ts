import { StorageApi } from "../types.ts";

/**
 * Default StorageAPI implementation using `sessionStorage`.
 * It gracefully handles environments where `sessionStorage` might not be available (e.g., SSR).
 */
export const sessionStorageStore: StorageApi = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch (error) {
      console.error("sessionStorage.getItem failed:", error);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch (error) {
      console.error("sessionStorage.setItem failed:", error);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error("sessionStorage.removeItem failed:", error);
    }
  },
};
