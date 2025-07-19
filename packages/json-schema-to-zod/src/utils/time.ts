import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

import { getTimeFormatErrorMessage } from "./format";

function timeToMillis(timeStr: string): number {
  const [hh, mm, ss = "0"] = timeStr.split(":");
  return (
    parseInt(hh, 10) * 3600000 +
    parseInt(mm, 10) * 60000 +
    parseInt(ss, 10) * 1000
  );
}

/**
 * Creates a Zod schema for validating time strings in the format HH:mm or HH:mm:ss.
 * Optionally, it can enforce minimum and maximum bounds on the time.
 *
 * @param schema - The JSON Schema containing optional bounds for time validation.
 * @returns A Zod schema for validating time strings with optional bounds.
 */
export function timeSchemaWithBounds(schema: JSONSchema) {
  const {
    formatMinimum,
    formatMaximum,
    formatExclusiveMinimum,
    formatExclusiveMaximum,
  } = schema;

  let base = z.iso.time();

  const isExclusiveMinimum = !!formatExclusiveMinimum;
  const isExclusiveMaximum = !!formatExclusiveMaximum;

  const minimum = isExclusiveMinimum ? formatExclusiveMinimum : formatMinimum;
  const maximum = isExclusiveMaximum ? formatExclusiveMaximum : formatMaximum;

  base = base.refine(
    (val) => {
      const valueMs = timeToMillis(val);
      const minMs = minimum ? timeToMillis(minimum as string) : -Infinity;
      const maxMs = maximum ? timeToMillis(maximum as string) : Infinity;
      return (
        (isExclusiveMinimum ? valueMs > minMs : valueMs >= minMs) &&
        (isExclusiveMaximum ? valueMs < maxMs : valueMs <= maxMs)
      );
    },
    {
      message: getTimeFormatErrorMessage("time", schema),
    },
  );

  return base;
}
