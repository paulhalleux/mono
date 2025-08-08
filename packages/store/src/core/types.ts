import type { WritableDraft } from "immer";

import type { Store } from "./store.ts";

export type StateValue = Record<string, any>;

export type AnySelectedValue = any;
export type ActionMetadata = {
  name?: string;
  [key: string]: any;
};

export type Selector<TState, TSelected> = (state: TState) => TSelected;
export type StoreListener<TState> = (state: TState, prevState: TState) => void;
export type Unsubscribe = () => void;
export type Updater<TState> = {
  (state: WritableDraft<TState>): void;
  metadata?: ActionMetadata;
};

export type Transaction<TState extends StateValue> = (
  store: Store<TState>,
) => void;

export interface ListenerEntry<TState> {
  callback: StoreListener<TState>;
  selector?: Selector<TState, AnySelectedValue>;
  lastValue?: AnySelectedValue;
  isEqual?: (a: AnySelectedValue, b: AnySelectedValue) => boolean;
}

export type Middleware<TState extends StateValue> = (
  store: Store<TState>,
  updater: Updater<TState>,
  next: (newUpdater: Updater<TState>) => void,
) => void;

export type MiddlewareFactory<TState extends StateValue> = (
  store: Store<TState>,
) => Middleware<TState>;
