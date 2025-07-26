import isEqual from "lodash/isequal";

type ItemComparator = (prev: any, next: any) => boolean;

function defaultCompareItem(prev: any, next: any): boolean {
  return isEqual(prev, next);
}

interface MemoizedItemCache<T> {
  value: T;
  dep: any;
}

interface MemoizedArrayItemsCache<T> {
  items: Map<string, MemoizedItemCache<T>>;
}

/**
 * Fine-grained memoization of an array, allowing each item to be re-created individually, now based on item IDs.
 *
 * @param itemFactory - Function that returns a single item by ID and previous item in order
 * @param getIds - Function that returns an array of item IDs in order
 * @param deps - Function that returns dependency per item by ID and args
 * @param compareItem - Comparator for detecting changes in dependencies
 */
export function memoizeArrayItems<T extends { id: string }, A extends any[]>({
  itemFactory,
  getIds,
  deps,
  compareItem = defaultCompareItem,
}: {
  itemFactory: (id: string, prevItemInArray: T | undefined, args: A) => T;
  getIds: (...args: A) => string[];
  deps: (id: string, args: A) => any;
  compareItem?: ItemComparator;
}) {
  let cache: MemoizedArrayItemsCache<T> | null = null;

  return {
    get: (...args: A): T[] => {
      const ids = getIds(...args);
      const newItems = new Map<string, MemoizedItemCache<T>>();
      let prevItemInArray: T | undefined = undefined;

      for (const id of ids) {
        const prevCache = cache?.items.get(id);
        const newDep = deps(id, args);

        let value: T;
        if (!prevCache || !compareItem(prevCache.dep, newDep)) {
          value = itemFactory(id, prevItemInArray, args);
        } else {
          value = prevCache.value;
        }

        newItems.set(id, { value, dep: newDep });
        prevItemInArray = value;
      }

      cache = { items: newItems };
      return ids.map((id) => newItems.get(id)!.value);
    },

    getCachedById: (id: string): T | undefined => {
      return cache?.items.get(id)?.value;
    },
  };
}
