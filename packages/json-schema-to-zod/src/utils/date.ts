import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

import { getTimeFormatErrorMessage } from "./format";

function dateToMillis(dateTimeStr: string): number {
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateTimeStr}`);
  }
  return date.getTime();
}

/**
 * Creates a Zod schema for validating date strings in ISO 8601 format.
 * Optionally, it can enforce minimum and maximum bounds on the date.
 *
 * @param schema - The JSON Schema containing optional bounds for date validation.
 * @returns A Zod schema for validating date strings with optional bounds.
 */
export function dateSchemaWithBounds(schema: JSONSchema) {
  const {
    formatMinimum,
    formatMaximum,
    formatExclusiveMinimum,
    formatExclusiveMaximum,
  } = schema;

  let base = z.iso.date();

  const isExclusiveMinimum = !!formatExclusiveMinimum;
  const isExclusiveMaximum = !!formatExclusiveMaximum;

  const minimum = isExclusiveMinimum ? formatExclusiveMinimum : formatMinimum;
  const maximum = isExclusiveMaximum ? formatExclusiveMaximum : formatMaximum;

  base = base.refine(
    (val) => {
      try {
        const valueMs = dateToMillis(val);
        const minMs = minimum ? dateToMillis(minimum as string) : -Infinity;
        const maxMs = maximum ? dateToMillis(maximum as string) : Infinity;
        return (
          (isExclusiveMinimum ? valueMs > minMs : valueMs >= minMs) &&
          (isExclusiveMaximum ? valueMs < maxMs : valueMs <= maxMs)
        );
      } catch {
        return false; // Invalid date string
      }
    },
    {
      message: getTimeFormatErrorMessage("date", schema),
    },
  );

  return base;
}
