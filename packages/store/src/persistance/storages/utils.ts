import {
  AsyncStorageApi,
  AsyncStorageApiSymbol,
  SyncStorageApi,
  SyncStorageApiSymbol,
} from "./types.ts";

export const createSyncStorageApi = (
  storage: Omit<SyncStorageApi, SyncStorageApiSymbol>,
): SyncStorageApi => {
  return {
    [SyncStorageApiSymbol]: SyncStorageApiSymbol,
    ...storage,
  };
};

export const createAsyncStorageApi = (
  storage: Omit<AsyncStorageApi, AsyncStorageApiSymbol>,
): AsyncStorageApi => {
  return {
    [AsyncStorageApiSymbol]: AsyncStorageApiSymbol,
    ...storage,
  };
};

export const isSyncStorageApi = (
  storage: SyncStorageApi | AsyncStorageApi,
): storage is SyncStorageApi => {
  return SyncStorageApiSymbol in storage;
};

export const isAsyncStorageApi = (
  storage: SyncStorageApi | AsyncStorageApi,
): storage is AsyncStorageApi => {
  return AsyncStorageApiSymbol in storage;
};
