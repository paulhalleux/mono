import isEqual from "lodash/isequal";

type ItemComparator = (prev: any, next: any) => boolean;

type CacheItem<T> = {
  value: T;
  dep: any;
};

type CacheState<T> = Map<string, CacheItem<T>>;

export interface ArrayCache<T> {
  get: (...args: any[]) => T[];
  getIds: (...args: any[]) => string[];
  getById: (id: string, ...args: any[]) => T | undefined;
}

function defaultCompareItem(prev: any, next: any): boolean {
  return isEqual(prev, next);
}

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
}): ArrayCache<T> {
  let cache: CacheState<T> | null = null;

  return {
    get: (...args: A): T[] => {
      const ids = getIds(...args);
      const newItems = new Map();
      let prevItemInArray: T | undefined = undefined;

      for (const id of ids) {
        const prevCache = cache?.get(id);
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

      cache = newItems;
      return ids.map((id) => newItems.get(id)!.value);
    },
    getIds: (...args: A): string[] => {
      return getIds(...args);
    },
    getById: (id: string, ...args: A): T | undefined => {
      const ids = getIds(...args);
      const index = ids.indexOf(id);
      if (index === -1) return undefined;

      const prevId = index > 0 ? ids[index - 1] : undefined;
      const prevItemInArray = prevId ? cache?.get(prevId)?.value : undefined;

      const newDep = deps(id, args);
      const prevCache = cache?.get(id);

      let value: T;
      if (!prevCache || !compareItem(prevCache.dep, newDep)) {
        value = itemFactory(id, prevItemInArray, args);
        cache ??= new Map(); // Initialize cache if null
        cache.set(id, { value, dep: newDep });
      } else {
        value = prevCache.value;
      }

      return value;
    },
  };
}
