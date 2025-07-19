import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

import { StringConverter } from "./string";

export const CONVERTERS = [StringConverter];

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
