import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  Middleware,
  MiddlewareFactory,
  StateValue,
  Store,
  Updater,
} from "../../src";

// Mock the attachMetadata utility if it's imported from another file
// If it's a simple Object.assign, you might not need to mock it.
// For robustness, let's mock it to ensure it correctly adds metadata.
vi.mock("./utils.ts", () => ({
  attachMetadata: (updater: Updater<any>, metadata: any) =>
    Object.assign(updater, { metadata }),
}));

interface TestState extends StateValue {
  count: number;
  message: string;
  user: {
    name: string;
    age: number;
  };
  items: string[];
  isLoading?: boolean; // Optional property for testing partial updates
}

describe("Store", () => {
  let initialState: TestState;
  let store: Store<TestState>;

  beforeEach(() => {
    initialState = {
      count: 0,
      message: "hello",
      user: { name: "Guest", age: 0 },
      items: [],
    };
    store = new Store(initialState);
    vi.clearAllMocks(); // Clear mocks for any spied/mocked functions
  });

  describe("constructor", () => {
    it("should initialize state with provided initialState", () => {
      const storeInstance = new Store(initialState);
      expect(storeInstance.getState()).toEqual(initialState);
      expect(storeInstance.getInitialState()).toEqual(initialState);
    });

    it("should initialize with empty middlewares if none provided", () => {
      const storeInstance = new Store(initialState);
      // Accessing private property for testing purposes, or test indirectly through dispatch
      expect((storeInstance as any).middlewares).toEqual([]);
    });

    it("should initialize with provided middlewares", () => {
      const mockMiddleware = vi.fn<Middleware<any>>((_, u, n) => n(u));
      const storeInstance = new Store(initialState, {
        middlewares: [mockMiddleware],
      });
      expect((storeInstance as any).middlewares.length).toBe(1);
    });
  });

  describe("getState", () => {
    it("should return the current state", () => {
      expect(store.getState()).toEqual(initialState);
    });
  });

  describe("getInitialState", () => {
    it("should return the initial state set during construction", () => {
      expect(store.getInitialState()).toEqual(initialState);
    });
  });

  describe("setState", () => {
    it("should update the state with a partial object", () => {
      store.setState({ count: 5, isLoading: true });
      expect(store.getState().count).toBe(5);
      expect(store.getState().isLoading).toBe(true);
      expect(store.getState().message).toBe("hello"); // Other properties unchanged
    });

    it("should update the state with an Immer updater function", () => {
      store.setState((draft) => {
        draft.count++;
        draft.user.name = "Alice";
        draft.items.push("item1");
      });
      expect(store.getState().count).toBe(1);
      expect(store.getState().user.name).toBe("Alice");
      expect(store.getState().items).toEqual(["item1"]);
    });

    it("should not notify listeners if state has not genuinely changed", () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.setState({}); // Empty update, state should be identical
      expect(listener).not.toHaveBeenCalled();

      store.setState(() => {});
      expect(listener).not.toHaveBeenCalled();
    });

    it("should handle nested object updates correctly via Immer", () => {
      store.setState((draft) => {
        draft.user.age = 30;
      });
      expect(store.getState().user.age).toBe(30);
      expect(store.getState().user.name).toBe("Guest");
    });

    it("should assign 'anonymous' metadata for partial object updates", () => {
      const mockDispatch = vi.spyOn(store as any, "_dispatch"); // Spy on private method

      store.setState({ count: 10 });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      const dispatchedUpdater = mockDispatch.mock.calls[0][0];
      expect(dispatchedUpdater).toBeInstanceOf(Function);
      expect((dispatchedUpdater as Updater<TestState>).metadata).toEqual({
        name: "anonymous",
      });
    });

    it("should retain existing metadata for updater functions if present", () => {
      const mockDispatch = vi.spyOn(store as any, "_dispatch");
      const myUpdater = store.createAction(
        (draft) => {
          draft.count = 20;
        },
        { name: "myCustomAction" },
      );

      store.setState(myUpdater);

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      const dispatchedUpdater = mockDispatch.mock.calls[0][0];
      expect((dispatchedUpdater as Updater<TestState>).metadata).toEqual({
        name: "myCustomAction",
      });
    });
  });

  describe("createAction", () => {
    it("should create an action with updater and optional metadata", () => {
      const updater = (draft: TestState) => {
        draft.count++;
      };
      const action = store.createAction(updater, { name: "increment" });

      expect(action).toBeInstanceOf(Function);
      expect(action.metadata).toEqual({ name: "increment" });
    });

    it("should create an action without metadata if none provided", () => {
      const updater = (draft: TestState) => {
        draft.count++;
      };
      const action = store.createAction(updater);

      expect(action).toBeInstanceOf(Function);
      expect(action.metadata).toBeUndefined();
    });
  });

  describe("subscribe", () => {
    it("should notify listener on state change", () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.setState({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 }),
        expect.objectContaining({ count: 0 }),
      );
    });

    it("should return an unsubscribe function", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe(); // Unsubscribe immediately
      store.setState({ count: 1 }); // Should not trigger listener
      expect(listener).not.toHaveBeenCalled();
    });

    it("should notify multiple listeners", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      store.subscribe(listener1);
      store.subscribe(listener2);

      store.setState({ count: 1 });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it("should notify listener only when selected value changes (with default shallowEqual)", () => {
      const listener = vi.fn();
      const selector = (state: TestState) => state.user; // Object reference
      store.subscribe(listener, selector);

      // Initial call to get lastValue, but not yet notify
      expect(listener).not.toHaveBeenCalled();

      // Update a different part of the state - user object reference unchanged
      store.setState({ count: 1 });
      expect(listener).not.toHaveBeenCalled();

      // Update user, but object reference might be the same with Immer if no deep change
      // If Immer produces a new object only if it's deeply changed:
      store.setState((draft) => {
        draft.user.age = 0; // No effective change from initial
      });
      expect(listener).not.toHaveBeenCalled();

      // Update user, causing deep change and new object reference from Immer
      store.setState((draft) => {
        draft.user.age = 25;
      });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ user: { name: "Guest", age: 25 } }),
        expect.objectContaining({ user: { name: "Guest", age: 0 } }),
      );
    });

    it("should notify listener when selected value changes (with custom isEqual)", () => {
      const listener = vi.fn();
      const selector = (state: TestState) => state.message;
      const customIsEqual = vi.fn(
        (a: string, b: string) => a.length === b.length,
      ); // Custom equality
      store.subscribe(listener, selector, customIsEqual);

      // Message is "hello" (length 5)
      store.setState({ message: "world" }); // Length 5, should not notify
      expect(listener).not.toHaveBeenCalled();
      expect(customIsEqual).toHaveBeenCalledWith("world", "hello");
      expect(store.getState().message).toBe("world");

      store.setState({ message: "longer" }); // Length 6, should notify
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ message: "longer" }),
        expect.objectContaining({ message: "world" }),
      );
      expect(customIsEqual).toHaveBeenLastCalledWith("longer", "world");
    });

    it("should handle errors in listener callbacks gracefully", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const badListener = vi.fn(() => {
        throw new Error("Error in listener");
      });
      const goodListener = vi.fn();

      store.subscribe(badListener);
      store.subscribe(goodListener);

      store.setState({ count: 1 });

      expect(badListener).toHaveBeenCalledTimes(1);
      expect(goodListener).toHaveBeenCalledTimes(1); // Good listener should still be called
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in listener callback:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("runTransaction", () => {
    it("should run the transaction function", () => {
      const transaction = vi.fn((s: Store<TestState>) => {
        s.setState({ count: 10 });
        s.setState((draft) => {
          draft.message = "updated";
        });
      });

      store.runTransaction(transaction);

      expect(transaction).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledWith(store);
      expect(store.getState().count).toBe(10);
      expect(store.getState().message).toBe("updated");
    });

    it("should defer listener notifications until transaction completes", () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.runTransaction((s) => {
        s.setState({ count: 1 }); // First update
        expect(listener).not.toHaveBeenCalled(); // Listener should NOT be called yet
        s.setState((draft) => {
          draft.count = 2; // Second update
        });
        expect(listener).not.toHaveBeenCalled(); // Still not called
      });

      expect(listener).toHaveBeenCalledTimes(1); // Called only once at the end
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ count: 2 }),
        expect.objectContaining({ count: 0 }),
      );
    });

    it("should restore state if transaction throws an error", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const initialStoreState = store.getState(); // Get initial state after constructor

      const transactionError = new Error("Transaction failed");
      const errorHandler = vi.fn();
      store = new Store(initialState, { onTransactionError: errorHandler }); // Re-init store for error handler test

      try {
        store.runTransaction((s) => {
          s.setState({ count: 999 }); // This update should be reverted
          throw transactionError; // Simulate an error
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // The error is caught internally by runTransaction, not re-thrown externally
        expect(true).toBe(false);
      }

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(
        transactionError,
        undefined, // No metadata provided in this call
      );
      expect(store.getState()).toEqual(initialStoreState); // State should be restored
      expect(consoleErrorSpy).not.toHaveBeenCalled(); // onTransactionError should handle it, not console.error

      consoleErrorSpy.mockRestore();
    });

    it("should call onTransactionError with metadata if provided", () => {
      const errorHandler = vi.fn();
      const storeInstance = new Store(initialState, {
        onTransactionError: errorHandler,
      });
      const transactionMetadata = { name: "criticalTransaction" };
      const transactionError = new Error("Error in important transaction");

      storeInstance.runTransaction((s) => {
        s.setState({ count: 5 });
        throw transactionError;
      }, transactionMetadata);

      expect(errorHandler).toHaveBeenCalledWith(
        transactionError,
        transactionMetadata,
      );
      expect(storeInstance.getState()).toEqual(initialState);
    });

    it("should not notify listeners if state did not change within transaction", () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.runTransaction(() => {
        // No state changes here
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("use (middleware)", () => {
    it("should apply middleware to state updates", () => {
      const middlewareSpy = vi.fn<MiddlewareFactory<TestState>>(
        () => (_, updater, next) => {
          // Add 100 to count for every update
          const newUpdater: Updater<TestState> = (draft) => {
            updater(draft);
            draft.count += 100;
          };
          next(newUpdater);
        },
      );

      store.use(middlewareSpy);

      store.setState((draft) => {
        draft.count = 5; // Should become 105 due to middleware
      });

      expect(middlewareSpy).toHaveBeenCalledTimes(1);
      expect(store.getState().count).toBe(105);
    });

    it("should compose multiple middlewares", () => {
      const add = vi.fn<MiddlewareFactory<TestState>>(
        () => (_, updater, next) => {
          const newUpdater: Updater<TestState> = (draft) => {
            updater(draft);
            draft.count += 10; // First middleware adds 10
          };
          next(newUpdater);
        },
      );

      const double = vi.fn<MiddlewareFactory<TestState>>(
        () => (_, updater, next) => {
          const newUpdater: Updater<TestState> = (draft) => {
            updater(draft);
            draft.count *= 2; // Second middleware doubles
          };
          next(newUpdater);
        },
      );

      store.use(add);
      store.use(double);

      store.setState((draft) => {
        draft.count = 1; // Initial update
      });

      expect(store.getState().count).toBe(22);
      expect(add).toHaveBeenCalledTimes(1);
      expect(double).toHaveBeenCalledTimes(1);
    });

    it("should pass correct store instance to middleware factory and middleware function", () => {
      const middlewareFactorySpy = vi.fn<MiddlewareFactory<TestState>>((s) => {
        expect(s).toBe(store); // Factory gets store instance
        return (s, u, n) => {
          expect(s).toBe(store); // Middleware function gets store instance
          n(u);
        };
      });

      store.use(middlewareFactorySpy);

      store.setState({ count: 1 });

      expect(middlewareFactorySpy).toHaveBeenCalledTimes(1);
      // The inner middleware function will also be called when setState is called.
    });
  });
});
