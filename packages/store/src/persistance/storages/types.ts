export const SyncStorageApiSymbol = Symbol("Persistence::SyncStorageApi");
export type SyncStorageApiSymbol = typeof SyncStorageApiSymbol;

export type SyncStorageApi = {
  [SyncStorageApiSymbol]: SyncStorageApiSymbol;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  hasItem: (key: string) => boolean;
};

export const AsyncStorageApiSymbol = Symbol("Persistence::AsyncStorageApi");
export type AsyncStorageApiSymbol = typeof AsyncStorageApiSymbol;

export type AsyncStorageApi = {
  [AsyncStorageApiSymbol]: AsyncStorageApiSymbol;
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  hasItem: (key: string) => Promise<boolean>;
};

export type StorageApi = SyncStorageApi | AsyncStorageApi;
