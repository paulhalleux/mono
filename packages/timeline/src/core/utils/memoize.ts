type DependencyComparator = (prevDeps: any[], nextDeps: any[]) => boolean;

function defaultCompareDeps(prevDeps: any[], nextDeps: any[]): boolean {
  if (prevDeps.length !== nextDeps.length) return false;
  for (let i = 0; i < prevDeps.length; i++) {
    if (prevDeps[i] !== nextDeps[i]) return false;
  }
  return true;
}

interface MemoizedCache<T> {
  value: T;
  deps: any[];
}

/**
 * Memoizes a result based on dependencies, which can be static or derived from arguments.
 *
 * @param factory - Function that computes the result, can take arguments
 * @param depsFn - Array or function that returns deps based on the same args as factory
 * @param compareDeps - Optional custom dependency comparator
 * @returns A function that accepts arguments and returns memoized value
 */
export function memoize<T, A extends any[]>(
  factory: (...args: A) => T,
  depsFn: ((...args: A) => any[]) | any[],
  compareDeps: DependencyComparator = defaultCompareDeps,
): (...args: A) => T {
  let cache: MemoizedCache<T> | null = null;

  return (...args: A): T => {
    const currentDeps = typeof depsFn === "function" ? depsFn(...args) : depsFn;

    if (!cache || !compareDeps(cache.deps, currentDeps)) {
      const value = factory(...args);
      cache = { value, deps: currentDeps };
    }

    return cache.value;
  };
}
