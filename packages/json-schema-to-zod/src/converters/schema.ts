import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

import { ArrayConverter } from "./array";
import { BooleanConverter } from "./boolean";
import { ConstConverter } from "./const";
import { NullConverter } from "./null";
import { NumericConverter } from "./numeric";
import { ObjectConverter } from "./object";
import { StringConverter } from "./string";

/**
 * Converts a JSON schema to a Zod schema.
 * @param schema - The JSON schema to convert.
 * @return The Zod schema.
 */
export function convertSchemaToZod(schema: JSONSchema | boolean): z.ZodType {
  if (typeof schema !== "object") {
    return z.unknown();
  }

  // Order matters, as the first matching converter will be used.
  // Order from most specific to least specific. And from least costly to most costly.
  const CONVERTERS = [
    ConstConverter,
    NullConverter,
    ObjectConverter,
    ArrayConverter,
    BooleanConverter,
    NumericConverter,
    StringConverter,
  ];

  const converter = CONVERTERS.find((c) => c.is(schema));

  if (!converter) {
    return z.unknown();
  }

  return converter.convert(schema);
}
