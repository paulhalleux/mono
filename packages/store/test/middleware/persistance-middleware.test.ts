import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AsyncMemoryStorageStore,
  AsyncStorageApi,
  attachMetadata,
  createPersistenceMiddleware,
  MemoryStorageStore,
  StateValue,
  Store,
} from "../../src";

interface TestState extends StateValue {
  count: number;
  user: {
    name: string;
    age: number;
  };
  settings: {
    theme: string;
  };
  sensitiveData: string;
}

// Mock Storage API for testing
let mockStorage = MemoryStorageStore.make();

// Reset mock storage before each test
beforeEach(() => {
  mockStorage = MemoryStorageStore.make();
  vi.clearAllMocks();
});

describe("createPersistenceMiddleware", () => {
  const initialState: TestState = {
    count: 0,
    user: { name: "Guest", age: 0 },
    settings: { theme: "light" },
    sensitiveData: "secret",
  };

  it("should rehydrate state from storage on initialization if data exists", async () => {
    const persistedState = {
      count: 10,
      settings: { theme: "dark" },
    };

    mockStorage.setItem("testKey", JSON.stringify(persistedState));
    const setItemSpy = vi.spyOn(mockStorage, "setItem");

    const store = new Store(initialState);
    store.use(
      createPersistenceMiddleware({
        key: "testKey",
        storage: mockStorage,
        get: (state) => state,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setItemSpy).toHaveBeenCalledWith("testKey", expect.any(String));
    expect(store.getState().count).toBe(10);
    expect(store.getState().user.name).toBe("Guest");
    expect(store.getState().settings.theme).toBe("dark");
  });

  it("should persist state changes to storage", async () => {
    const store = new Store(initialState);
    store.use(
      createPersistenceMiddleware({
        key: "testKey",
        storage: mockStorage,
        get: (state) => state,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Update the state
    store.setState((draft) => {
      draft.count = 5;
      draft.user.name = "Alice";
    });

    const storedData = mockStorage.getItem("testKey");
    expect(storedData).toBeDefined();

    const parsedData = JSON.parse(storedData!);
    expect(parsedData.count).toBe(5);
    expect(parsedData.user.name).toBe("Alice");
  });

  it("should not persist state if no changes are made", async () => {
    const store = new Store(initialState);
    store.use(
      createPersistenceMiddleware({
        key: "testKey",
        storage: mockStorage,
        get: (state) => state,
      }),
    );

    // Check that no data was stored initially
    expect(mockStorage.getItem("testKey")).toBeNull();
  });

  it("should queue updates during rehydration", async () => {
    const asyncStorage = AsyncMemoryStorageStore.make(100);

    // Simulate existing data in async storage
    await asyncStorage.setItem("testKey", JSON.stringify({ count: 20 }));

    const store = new Store(initialState);
    store.use(
      createPersistenceMiddleware({
        key: "testKey",
        storage: asyncStorage,
        get: (state) => state,
      }),
    );

    // Update state while rehydration is in progress
    store.setState(
      attachMetadata(
        (draft) => {
          draft.count = 15;
        },
        {
          name: "Update count to 15",
        },
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(store.getState().count).toBe(initialState.count); // Should reflect rehydrated value

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(store.getState().count).toBe(15);
  });

  it("should handle errors during persistence", async () => {
    const onPersistError = vi.fn();
    const errorStorage = {
      ...mockStorage,
      setItem: vi.fn(() => {
        throw new Error("Storage error");
      }),
    };

    const store = new Store(initialState);
    store.use(
      createPersistenceMiddleware({
        key: "testKey",
        storage: errorStorage,
        get: (state) => state,
        onPersistError,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    store.setState((draft) => {
      draft.count = 1;
    });

    expect(errorStorage.setItem).toHaveBeenCalled();
    expect(onPersistError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should handle errors during persistence with async storage", async () => {
    const onPersistError = vi.fn();
    const errorStorage = {
      ...AsyncMemoryStorageStore.make(0),
      setItem: vi.fn(() => {
        return new Promise((_, reject) => {
          reject(new Error("Async storage error"));
        });
      }),
    } as AsyncStorageApi;

    const store = new Store(initialState);
    store.use(
      createPersistenceMiddleware({
        key: "testKey",
        storage: errorStorage,
        get: (state) => state,
        onPersistError,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    store.setState((draft) => {
      draft.count = 1;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorStorage.setItem).toHaveBeenCalled();
    expect(onPersistError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should handle errors during rehydration", async () => {
    const onRehydrateError = vi.fn();
    const errorStorage = {
      ...mockStorage,
      getItem: vi.fn(() => {
        throw new Error("Rehydration error");
      }),
    };

    const store = new Store(initialState);
    store.use(
      createPersistenceMiddleware({
        key: "testKey",
        storage: errorStorage,
        get: (state) => state,
        onRehydrateError,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorStorage.getItem).toHaveBeenCalled();
    expect(onRehydrateError).toHaveBeenCalledWith(expect.any(Error));
    expect(store.getState()).toEqual(initialState);
  });
});
