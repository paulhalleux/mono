import { createSyncStorageApi } from "./utils.ts";

export const SessionStorageStore = {
  make() {
    return createSyncStorageApi({
      getItem: (key: string): string | null => {
        if (typeof window !== "undefined" && window.sessionStorage) {
          return window.sessionStorage.getItem(key);
        }
        return null;
      },
      setItem: (key: string, value: string): void => {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.setItem(key, value);
        }
      },
      removeItem: (key: string): void => {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.removeItem(key);
        }
      },
      hasItem: (key: string): boolean => {
        if (typeof window !== "undefined" && window.sessionStorage) {
          return window.sessionStorage.getItem(key) !== null;
        }
        return false;
      },
    });
  },
};
