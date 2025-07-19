import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

function dateTimeToMillis(dateTimeStr: string): number {
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date-time string: ${dateTimeStr}`);
  }
  return date.getTime();
}

function getErrorMessage({
  formatMinimum,
  formatMaximum,
  formatExclusiveMinimum,
  formatExclusiveMaximum,
}: JSONSchema): string {
  return "Invalid date-time"; // fallback (shouldn't happen)
}

/**
 * Creates a Zod schema for validating date-time strings in ISO 8601 format.
 * Optionally, it can enforce minimum and maximum bounds on the date-time.
 *
 * @param schema - The JSON Schema containing optional bounds for date-time validation.
 * @returns A Zod schema for validating date-time strings with optional bounds.
 */
export function dateTimeSchemaWithBounds(schema: JSONSchema) {
  const {
    formatMinimum,
    formatMaximum,
    formatExclusiveMinimum,
    formatExclusiveMaximum,
  } = schema;

  let base = z.iso.datetime();

  const isExclusiveMinimum = !!formatExclusiveMinimum;
  const isExclusiveMaximum = !!formatExclusiveMaximum;

  const minimum = isExclusiveMinimum ? formatExclusiveMinimum : formatMinimum;
  const maximum = isExclusiveMaximum ? formatExclusiveMaximum : formatMaximum;

  base = base.refine(
    (val) => {
      try {
        const valueMs = dateTimeToMillis(val);
        const minMs = minimum ? dateTimeToMillis(minimum as string) : -Infinity;
        const maxMs = maximum ? dateTimeToMillis(maximum as string) : Infinity;
        return (
          (isExclusiveMinimum ? valueMs > minMs : valueMs >= minMs) &&
          (isExclusiveMaximum ? valueMs < maxMs : valueMs <= maxMs)
        );
      } catch {
        return false; // Invalid date-time string
      }
    },
    {
      message: getErrorMessage(schema),
    },
  );

  return base;
}
