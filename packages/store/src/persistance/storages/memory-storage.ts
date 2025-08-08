import { createAsyncStorageApi, createSyncStorageApi } from "./utils.ts";

export const MemoryStorageStore = {
  make() {
    const data: Record<string, string> = {};
    return createSyncStorageApi({
      getItem: (key: string): string | null => {
        return data[key] || null;
      },
      setItem: (key: string, value: string): void => {
        data[key] = value;
      },
      removeItem: (key: string): void => {
        delete data[key];
      },
      hasItem: (key: string): boolean => {
        return key in data;
      },
    });
  },
};

export const AsyncMemoryStorageStore = {
  make(delay = 0) {
    const data: Record<string, string> = {};
    return createAsyncStorageApi({
      getItem: (key: string): Promise<string | null> => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(data[key] || null);
          }, delay);
        });
      },
      setItem: (key: string, value: string): Promise<void> => {
        return new Promise((resolve) => {
          setTimeout(() => {
            data[key] = value;
            resolve();
          }, delay);
        });
      },
      removeItem: (key: string): Promise<void> => {
        return new Promise((resolve) => {
          setTimeout(() => {
            delete data[key];
            resolve();
          }, delay);
        });
      },
      hasItem: (key: string): Promise<boolean> => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(key in data);
          }, delay);
        });
      },
    });
  },
};
