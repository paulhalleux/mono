import { WritableDraft } from "immer";
import { UseBoundStore } from "zustand/react";
import { StoreApi } from "zustand/vanilla";

/**
 * Store
 * ---
 * This type is used to define the store
 * It includes the store API and the store updater
 * It is based on Zustand react store (UseBoundStore) and the vanilla store API
 */
export type Store<State> = UseBoundStore<StoreApi<State>>;

/**
 * Store updater function
 * ---
 * This type is used to define the store updater function
 * It is based on Immer WritableDraft
 */
export type UpdaterFn<State> = (
  draft: WritableDraft<State>,
) => void | WritableDraft<State>;

/**
 * Store updater
 * ---
 * This type is used to define the store updater
 * It is a function that takes an updater function as argument
 */
export type StoreUpdater<State> = (update: UpdaterFn<State>) => void;

/**
 * Store builder
 * ---
 * This type is used to define the store builder
 * It is a function that takes the initial state as argument and returns the store
 */
export type StoreBuilder<State> = (initialState: State) => Store<State>;
