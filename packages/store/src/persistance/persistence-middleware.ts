import { MiddlewareFactory, StateValue, Store, Updater } from "../core";
import { attachMetadata } from "../core/utils.ts";

import { LocalStorageStore } from "./storages";
import { PersistOptions } from "./types";

const REHYDRATE_ACTION_NAME = "action::rehydrate";

const tryPromise = <T>(fn: () => T | Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    try {
      const result = fn();
      if (result instanceof Promise) {
        result.then(resolve).catch(reject);
      } else {
        resolve(result);
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Creates a persistence middleware for a Redux-like store.
 * This middleware automatically saves and loads the store's state from a specified storage.
 * It also queues updates that happen before rehydration is complete.
 */
export const createPersistenceMiddleware = <
  TState extends StateValue,
  TPersistedState,
>(
  options: PersistOptions<TState, TPersistedState>,
): MiddlewareFactory<TState> => {
  const {
    key,
    get,
    storage = LocalStorageStore.make(),
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onRehydrate,
    onPersistError,
    onPersistSuccess,
    onRehydrateError,
    onRehydrateSuccess,
  } = options;

  let rehydrated = false;
  let isRehydrationInProgress = false;
  const updateQueue: Updater<TState>[] = [];

  const persistState = (state: TState) => {
    try {
      const stateToStore = get(state);
      const serializedState = serialize(stateToStore);
      const r = storage.setItem(key, serializedState);
      if (r instanceof Promise) {
        r.catch((error) => {
          onPersistError?.(error as Error);
        });
      }
      onPersistSuccess?.(stateToStore);
    } catch (error) {
      onPersistError?.(error as Error);
    }
  };

  const rehydrateState = (store: Store<TState>) => {
    if (rehydrated) {
      return;
    }

    const _rehydrate = (storedItem: string | null) => {
      if (storedItem === null) {
        return;
      }

      const parsedState = deserialize(storedItem) as TPersistedState;
      const initialState = store.getInitialState();

      let stateToSet: TState;
      if (onRehydrate) {
        stateToSet = onRehydrate(parsedState, initialState);
      } else {
        stateToSet = { ...initialState, ...parsedState };
      }

      store.runTransaction(() => {
        const updater = attachMetadata(
          (draft) => {
            Object.assign(draft, stateToSet);
          },
          {
            name: REHYDRATE_ACTION_NAME,
          },
        );

        store.setState(updater);
      });

      onRehydrateSuccess?.(parsedState, initialState);
    };

    const _catch = (error: Error) => {
      onRehydrateError?.(error);
      if (storage.removeItem) {
        storage.removeItem(key);
      }
    };

    const _finally = () => {
      rehydrated = true;
      while (updateQueue.length > 0) {
        const queuedUpdater = updateQueue.shift();
        if (queuedUpdater) {
          store.setState(queuedUpdater);
        }
      }
      isRehydrationInProgress = false;
    };

    tryPromise(() => storage.getItem(key))
      .then(_rehydrate)
      .catch(_catch)
      .finally(_finally);
  };

  return (store) => {
    if (!isRehydrationInProgress) {
      isRehydrationInProgress = true;
      rehydrateState(store);
    }

    return (storeInstance, updater, next) => {
      if (
        !rehydrated &&
        isRehydrationInProgress &&
        updater.metadata?.name !== REHYDRATE_ACTION_NAME
      ) {
        updateQueue.push(updater);
      } else {
        next(updater);
        if (updater.name !== REHYDRATE_ACTION_NAME) {
          persistState(storeInstance.getState());
        }
      }
    };
  };
};
