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
  items: MemoizedItemCache<T>[];
}

/**
 * Fine-grained memoization of an array, allowing each item to be re-created individually.
 *
 * @param itemFactory - Function that returns a single item by index and args
 * @param itemCountFn - Function that returns total number of items to memoize
 * @param depsFn - Function that returns dependency per item by index and args
 * @param compareItem - Comparator for detecting changes in dependencies
 */
export function memoizeArrayItems<T, A extends any[]>({
  itemFactory,
  itemCountFn,
  deps,
  compareItem = defaultCompareItem,
}: {
  itemFactory: (index: number, prevItem: T | undefined, args: A) => T;
  itemCountFn: (...args: A) => number;
  deps: (index: number, args: A) => any;
  compareItem?: ItemComparator;
}): (...args: A) => T[] {
  let cache: MemoizedArrayItemsCache<T> | null = null;

  return (...args: A): T[] => {
    const count = itemCountFn(...args);
    if (!cache || cache.items.length !== count) {
      const items: MemoizedItemCache<T>[] = [];
      for (let i = 0; i < count; i++) {
        const value = itemFactory(i, items[i - 1]?.value, args);
        const dep = deps(i, args);
        items.push({ value, dep });
      }
      cache = { items };
    } else {
      for (let i = 0; i < count; i++) {
        const newDep = deps(i, args);
        if (!compareItem(cache.items[i].dep, newDep)) {
          const newValue = itemFactory(i, cache.items[i - 1]?.value, args);
          cache.items[i] = {
            value: newValue,
            dep: newDep,
          };
        }
      }
    }

    return cache.items.map((item) => item.value);
  };
}
