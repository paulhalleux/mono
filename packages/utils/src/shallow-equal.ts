/**
 * Performs a shallow comparison between two values.
 * @param a The first value to compare.
 * @param b The second value to compare.
 * @returns True if the values are shallowly equal, false otherwise.
 */
export const shallowEqual = (a: any, b: any): boolean => {
  // 1. Strict equality check (handles primitives, null, undefined, and same object/function reference)
  if (a === b) {
    return true;
  }

  // 2. Check if either is not an object or is null (handles different types or non-objects)
  // If `a` or `b` is null or not an object, and they are not strictly equal (already checked),
  // then they cannot be shallowly equal.
  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  ) {
    return false;
  }

  // 3. Handle Arrays
  // If both are arrays, perform a shallow array comparison.
  // If one is an array and the other is not, they are not equal (handled by previous type check if one isn't an object)
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  // If one is an array and the other is not (but both are objects), they're not shallowly equal
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  // 4. Handle Plain Objects (and other non-array objects that passed type checks)
  // Get keys for comparison. Using `Object.keys` for enumerable own properties.
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // Check if they have the same number of keys
  if (keysA.length !== keysB.length) {
    return false;
  }

  // Check if all keys and their corresponding values are strictly equal
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    // Ensure `b` has the same key and its value is strictly equal to `a`'s value.
    // `hasOwnProperty` check is important for robustness against inherited properties.
    if (!Object.prototype.hasOwnProperty.call(b, key) || a[key] !== b[key]) {
      return false;
    }
  }

  return true;
};
