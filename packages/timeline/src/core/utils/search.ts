export function binarySearchIndex<T>(
  items: T[],
  predicate: (item: T) => boolean,
  findFirstMatch: boolean,
): number {
  let left = 0,
    right = items.length - 1,
    result = findFirstMatch ? items.length : -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (predicate(items[mid])) {
      result = mid;
      if (findFirstMatch) {
        right = mid - 1; // move left
      } else {
        left = mid + 1; // move right
      }
    } else {
      if (findFirstMatch) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return result;
}
