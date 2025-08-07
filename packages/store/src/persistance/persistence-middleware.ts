import { Middleware, StateValue } from "../core";

import { localStorageStore } from "./storages";
import type { PersistOptions } from "./types.ts";

const defaultSerialize = <TState extends StateValue>(state: TState): string =>
  JSON.stringify(state);

const defaultDeserialize = <TState extends StateValue>(
  persistedState: string,
): TState => JSON.parse(persistedState);

const REHYDRATION_ACTION_NAME = "STORE_REHYDRATE_INTERNAL";

/**
 * Creates a persistence middleware for a Store.
 *
 * @param options Configuration options for persistence.
 * @returns A StoreMiddleware function.
 */
export const createPersistenceMiddleware = <TState extends StateValue>(
  options: PersistOptions<TState>,
): Middleware<TState> => {
  const {
    key,
    storage = localStorageStore,
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
    whitelist,
    blacklist,
    getSnapshot,
    onRehydrate,
    rehydrateOnlyOnce = true,
  } = options;

  let hasRehydrated = false;

  const filterState = (state: TState): Partial<TState> => {
    if (getSnapshot) {
      return getSnapshot(state);
    }

    if (whitelist && whitelist.length > 0) {
      const filtered: Partial<TState> = {};
      whitelist.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(state, k)) {
          filtered[k] = state[k];
        }
      });
      return filtered;
    }

    if (blacklist && blacklist.length > 0) {
      const filtered: Partial<TState> = {};
      for (const k in state) {
        if (
          Object.prototype.hasOwnProperty.call(state, k) &&
          !blacklist.includes(k as keyof TState)
        ) {
          filtered[k] = state[k];
        }
      }
      return filtered;
    }

    return state;
  };

  return (store, updater, next) => {
    // Phase 1: Pre-update logic (before the state change)
    if (!hasRehydrated && rehydrateOnlyOnce) {
      // Attempt to rehydrate immediately if this is the first dispatch and allowed
      const persisted = storage.getItem(key);
      // Handle both synchronous and asynchronous getItem
      Promise.resolve(persisted).then((str) => {
        if (str) {
          try {
            const loadedState = deserialize(str) as TState;
            const finalState = onRehydrate
              ? onRehydrate(loadedState, store.getState())
              : { ...store.getState(), ...loadedState };

            // Use runAction to update state and go through the chain again
            store.setState(
              store.createAction(
                (draft) => {
                  Object.assign(draft, finalState);
                  draft.__internal.hasHydrated = true;
                },
                {
                  name: REHYDRATION_ACTION_NAME,
                },
              ),
            );
          } catch (error) {
            console.error(
              "Persistence Middleware: Failed to deserialize or rehydrate state:",
              error,
            );
            storage.removeItem?.(key);
          }
        }
      });
      hasRehydrated = true;
    }

    next(updater);

    // Phase 3: Post-update logic (after the state has been updated)
    // Only save if it's not the initial rehydration action itself
    // We check `_isRehydration` flag on the metadata or the state's `_hasHydrated` flag.
    const isInternalRehydrationAction =
      updater.metadata?.name === REHYDRATION_ACTION_NAME;

    if (!isInternalRehydrationAction) {
      try {
        const stateToPersist = filterState(store.getState());
        storage.setItem(key, serialize(stateToPersist as TState));
      } catch (error) {
        console.error(
          "Persistence Middleware: Failed to persist state:",
          error,
        );
      }
    }
  };
};

// --- Initial Hydration Logic (outside the middleware for initial load) ---
export const loadPersistedState = async <TState extends StateValue>(
  options: PersistOptions<TState>,
  defaultInitialState: TState,
): Promise<TState> => {
  const {
    key,
    storage = localStorageStore,
    deserialize = defaultDeserialize,
    onRehydrate,
  } = options;
  try {
    const persisted = await storage.getItem(key);
    if (persisted) {
      const loadedState = deserialize(persisted) as TState;
      return onRehydrate
        ? onRehydrate(loadedState, defaultInitialState)
        : { ...defaultInitialState, ...loadedState };
    }
  } catch (error) {
    console.error("Persistence: Failed to load state from storage.", error);
    storage.removeItem?.(key);
  }
  return defaultInitialState;
};
