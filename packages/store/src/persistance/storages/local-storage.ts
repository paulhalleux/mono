import { createSyncStorageApi } from "./utils.ts";

export const LocalStorageStore = {
  make() {
    return createSyncStorageApi({
      getItem: (key: string): string | null => {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key: string, value: string): void => {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: (key: string): void => {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      },
      hasItem: (key: string): boolean => {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage.getItem(key) !== null;
        }
        return false;
      },
    });
  },
};
