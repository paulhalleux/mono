import { produce } from "immer";
import { create } from "zustand";

import { Store, StoreUpdater } from "./types";

export * from "./types";

/**
 * Create a new store
 * ---
 * This function is used to create a new store using Zustand
 * @param initialState Initial state
 */
export function createDefaultStore<State>(initialState: State): Store<State> {
  return create(() => initialState);
}

/**
 * Create a store updater
 * ---
 * This function is used to update the store state using immer
 * @param store Store
 */
export function createStoreUpdater<State>(
  store: Store<State>,
): StoreUpdater<State> {
  return (updater) => {
    store.setState(produce(store.getState(), updater));
  };
}
