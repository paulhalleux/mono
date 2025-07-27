import { ItemInstance as TimelineItemInstance } from "../types.ts";

import { binarySearchIndex } from "./search.ts";

export function virtualizeItems(
  items: TimelineItemInstance[],
  timePosition: number,
  viewportDuration: number,
): string[] {
  if (items.length === 0) return [];
  const sortedItems = items.toSorted((a, b) => a.start - b.start);

  const startIndex = binarySearchIndex(
    sortedItems,
    (item) => item.end > timePosition,
    true,
  );

  const endIndex = binarySearchIndex(
    sortedItems,
    (item) => item.start < timePosition + viewportDuration,
    false,
  );

  if (startIndex >= sortedItems.length || endIndex < 0) return [];

  return sortedItems.slice(startIndex, endIndex + 1).map((item) => item.id);
}
