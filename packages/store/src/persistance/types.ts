import { StateValue } from "../core";

export type StorageApi = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem?: (key: string) => void | Promise<void>;
};

export type PersistOptions<TState extends StateValue> = {
  /** The key to use for storing state in the chosen storage. */
  key: string;
  /** The storage API to use (localStorage, sessionStorage, or custom). */
  storage?: StorageApi;
  /** A function to serialize the state before storing. Defaults to JSON.stringify. */
  serialize?: (state: TState) => string;
  /** A function to deserialize the state when loading. Defaults to JSON.parse. */
  deserialize?: (persistedState: string) => TState;
  /**
   * An array of state keys to explicitly persist. If not provided, the entire state is persisted.
   * If provided, only these keys will be stored.
   */
  whitelist?: Array<keyof TState>;
  /**
   * An array of state keys to explicitly omit from persistence.
   * Takes precedence over `whitelist`.
   */
  blacklist?: Array<keyof TState>;
  /**
   * A function to get a snapshot of the state for persistence.
   * If not provided, the entire state will be persisted and whitelisted/blacklisted keys will be applied.
   */
  getSnapshot?: (state: TState) => Partial<TState>;
  /**
   * Called when state is rehydrated from storage.
   * You can use this to merge the rehydrated state with initial state.
   */
  onRehydrate?: (rehydratedState: TState, initialState: TState) => TState;
  /**
   * If true, rehydration will only occur once when the store is instantiated.
   * Default: true.
   */
  rehydrateOnlyOnce?: boolean;
};
