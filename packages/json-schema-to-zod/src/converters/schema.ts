import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

import { BooleanConverter } from "./boolean";
import { ConstConverter } from "./const";
import { NullConverter } from "./null";
import { NumericConverter } from "./numeric";
import { StringConverter } from "./string";

// Order matters, as the first matching converter will be used.
// Order from most specific to least specific. And from least costly to most costly.
export const CONVERTERS = [
  ConstConverter,
  NullConverter,
  BooleanConverter,
  NumericConverter,
  StringConverter,
];

/**
 * Converts a JSON schema to a Zod schema.
 * @param schema - The JSON schema to convert.
 * @return The Zod schema.
 */
export function convertSchemaToZod(schema: JSONSchema): z.ZodType {
  const converter = CONVERTERS.find((c) => c.is(schema));

  if (!converter) {
    throw z.unknown();
  }

  return converter.convert(schema);
}
