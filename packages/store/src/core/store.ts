import { shallowEqual } from "@paulhalleux/utils";
import { produce } from "immer";

import type {
  ActionMetadata,
  ListenerEntry,
  Middleware,
  MiddlewareFactory,
  Selector,
  StateValue,
  StoreListener,
  Transaction,
  Unsubscribe,
  Updater,
} from "./types";
import { attachMetadata } from "./utils.ts";

export type StoreOptions<TState extends StateValue> = {
  /**
   * An array of middleware functions to apply to the store.
   * Middleware can intercept state updates and perform additional actions.
   */
  middlewares?: Middleware<TState>[];

  /**
   * Optional callback for handling errors that occur during transactions.
   * This can be used to log errors or perform custom error handling.
   */
  onTransactionError?: (error: unknown, metadata?: ActionMetadata) => void;
};

/**
 * A generic store for managing application state.
 * @template TState The type of the state managed by this store.
 */
export class Store<TState extends StateValue> {
  private state: TState;
  private readonly initialState: TState;
  private listeners: Set<ListenerEntry<TState>>;
  private middlewares: Middleware<TState>[] = [];

  private readonly options: StoreOptions<TState>;

  constructor(initialState: TState, options?: StoreOptions<TState>) {
    this.initialState = initialState;
    this.state = Object.assign({}, initialState);
    this.listeners = new Set();
    this.middlewares = options?.middlewares || [];
    this.options = options || {};
  }

  /**
   * Returns the current state.
   */
  getState(): TState {
    return this.state;
  }

  /**
   * Returns the initial state of the store.
   * This is useful for resetting the store or for testing purposes.
   */
  getInitialState(): TState {
    return this.initialState;
  }

  /**
   * Updates the state using an Immer producer function or a partial state object.
   * Notifies listeners only if the state has genuinely changed.
   * @param updater A function that receives a Draft of the state (allowing direct mutation),
   *                or a partial state object to merge.
   */
  setState(updater: Partial<TState> | Updater<TState>): void {
    if (typeof updater === "function") {
      this._dispatch(updater);
    } else {
      this._dispatch(
        attachMetadata(
          (draft) => {
            Object.assign(draft, updater);
          },
          {
            name: "anonymous",
          },
        ),
      );
    }
  }

  /**
   * Creates an action that can be dispatched to update the state.
   * The action can be a function that receives a Draft of the state.
   * Optionally, metadata can be provided for the action (e.g., name).
   * @param updater The Immer updater function for the state.
   * @param metadata Optional metadata for the action (e.g., name).
   */
  createAction(updater: Updater<TState>, metadata?: ActionMetadata) {
    return Object.assign(updater, {
      metadata,
    });
  }

  /**
   * Subscribes a listener function to state changes.
   * The listener will be called with the current state and previous state
   * whenever it changes. Returns an unsubscribe function.
   * @param listener The callback function to be called on state changes.
   * @param selector An optional selector function to derive a specific value from the state.
   * @param isEqual An optional function to compare the selected value for changes.
   */
  subscribe<TSelected>(
    listener: StoreListener<TState>,
    selector?: Selector<TState, TSelected>,
    isEqual?: (a: TSelected, b: TSelected) => boolean,
  ): Unsubscribe {
    const entry: ListenerEntry<TState> = {
      callback: listener,
      selector,
      isEqual,
      lastValue: selector ? selector(this.state) : undefined,
    };

    this.listeners.add(entry);
    return () => {
      this.listeners.delete(entry);
    };
  }

  /**
   * Runs a transaction that can modify the state.
   * The transaction function receives the store instance and can call setState
   * or other methods to update the state.
   * If an error occurs, the previous state is restored.
   * Listener notifications are deferred until the transaction completes.
   * @param transaction The transaction function to run.
   * @param metadata Optional metadata for the transaction (e.g., name).
   */
  runTransaction(
    transaction: Transaction<TState>,
    metadata?: ActionMetadata,
  ): void {
    const prevListeners = new Set(this.listeners);
    const prevState = this.state;

    try {
      this.listeners.clear();
      transaction(this);
    } catch (error) {
      this.options.onTransactionError?.(error, metadata);
      this.state = prevState;
    } finally {
      this.listeners = prevListeners;
      if (this.state !== prevState) {
        this._notifyListeners(prevState);
      }
    }
  }

  /**
   * Applies a middleware to the store.
   * Middleware can intercept state updates and perform additional actions.
   * This method is typically called during store initialization.
   * @param middleware The middleware function to apply. Must be a middleware factory.
   */
  use(middleware: MiddlewareFactory<TState>): void {
    this.middlewares.push(middleware(this));
  }

  /**
   * Applies the update to the state using Immer and notifies listeners.
   * This is an internal method, called by _dispatch.
   * @param updater The Immer updater function for the state.
   */
  private _applyUpdateAndNotify(updater: Updater<TState>): void {
    const oldState = this.state;
    const nextState = produce(oldState, updater);

    if (nextState !== oldState) {
      this.state = nextState;
      this._notifyListeners(oldState);
    }
  }

  /**
   * Dispatches an update through the middleware chain.
   * This is the entry point for all state modifications.
   * @param updater The Immer updater function for the state.
   */
  private _dispatch(updater: Updater<TState>): void {
    const currentNext: (action: Updater<TState>) => void = (actionToApply) =>
      this._applyUpdateAndNotify(actionToApply);

    const composedMiddlewareChain = this.middlewares.reduceRight(
      (
        nextFunctionInChain: (action: Updater<TState>) => void,
        middleware: Middleware<TState>,
      ) => {
        return (action: Updater<TState>) => {
          middleware(this, action, (newUpdater: Updater<TState>) => {
            nextFunctionInChain(newUpdater);
          });
        };
      },
      currentNext,
    );

    composedMiddlewareChain(updater);
  }

  /**
   * Notifies all registered listeners with the current state and previous state.
   * This is an internal method, called by setState.
   * @param prevState The state before the current update.
   */
  private _notifyListeners(prevState: TState): void {
    const currentState = this.state;
    const defaultIsEqual = shallowEqual;

    [...this.listeners].forEach((entry) => {
      try {
        if (entry.selector) {
          const newSelectedValue = entry.selector(currentState);
          const currentIsEqual = entry.isEqual || defaultIsEqual;

          if (!currentIsEqual(newSelectedValue, entry.lastValue)) {
            entry.lastValue = newSelectedValue; // Update last value for next comparison
            console.log("set lastValue", entry.lastValue);
            entry.callback(currentState, prevState);
          } else {
            entry.lastValue = newSelectedValue;
          }
        } else {
          entry.callback(currentState, prevState);
        }
      } catch (error) {
        console.error("Error in listener callback:", error);
      }
    });
  }
}
