import { StateValue } from "../core";

import { StorageApi } from "./storages/types.ts";

export type PersistOptions<TState extends StateValue, TPersistedState> = {
  /** The key to use for storing state in the chosen storage. */
  key: string;
  /** The storage API to use (localStorage, sessionStorage, or custom). */
  storage?: StorageApi;
  /** A function to serialize the state before storing. Defaults to JSON.stringify. */
  serialize?: (state: TState) => string;
  /** A function to deserialize the state when loading. Defaults to JSON.parse. */
  deserialize?: (persistedState: string) => TState;
  /**
   * A function to get a snapshot of the state for persistence.
   * If not provided, the entire state will be persisted and whitelisted/blacklisted keys will be applied.
   */
  get: (state: TState) => TPersistedState;
  /**
   * Called when state is rehydrated from storage.
   * You can use this to merge the rehydrated state with initial state.
   */
  onRehydrate?: (
    rehydratedState: TPersistedState,
    initialState: TState,
  ) => TState;
  /**
   * Called when rehydration fails.
   * @param error The error that occurred during rehydration.
   */
  onRehydrateError?: (error: Error) => void;
  /**
   * Called when rehydration is successful.
   * @param rehydratedState The state that was rehydrated from storage.
   * @param initialState The initial state of the store before rehydration.
   */
  onRehydrateSuccess?: (
    rehydratedState: TPersistedState,
    initialState: TState,
  ) => void;
  /**
   * Optional callback for handling errors that occur during persistence.
   * This can be used to log errors or perform custom error handling.
   */
  onPersistError?: (error: Error) => void;
  /**
   * Optional callback for handling successful persistence.
   * This can be used to log success or perform custom actions after persistence.
   */
  onPersistSuccess?: (persistedState: TPersistedState) => void;
  /**
   * If true, the initial state will be persisted immediately if no data exists in storage.
   * Default: true.
   */
  persistInitialState?: boolean;
};
