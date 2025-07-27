import { ItemInstance as TimelineItemInstance } from "../types.ts";

import { binarySearchIndex } from "./search.ts";

export function virtualizeItems(
  items: TimelineItemInstance[],
  timePosition: number,
  viewportDuration: number,
): string[] {
  if (items.length === 0) return [];

  const startIndex = binarySearchIndex(
    items,
    (item) => item.end > timePosition,
    true,
  );

  const endIndex = binarySearchIndex(
    items,
    (item) => item.start < timePosition + viewportDuration,
    false,
  );

  if (startIndex >= items.length || endIndex < 0) return [];

  return items.slice(startIndex, endIndex + 1).map((item) => item.id);
}
