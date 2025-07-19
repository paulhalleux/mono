import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

import { Converter } from "../types";
import { dateTimeSchemaWithBounds } from "../utils/date-time";
import { timeSchemaWithBounds } from "../utils/time";

export const STRING_TYPE = "string";
export const STRING_PROPERTIES = [
  "minLength",
  "maxLength",
  "pattern",
  "format",
] as const;

export const STRING_SUPPORTED_FORMATS = [
  "email",
  "date",
  "time",
  "date-time",
  "uuid",
] as const;

export const STRING_FORMAT_ALLOWING_INTERSECTION: {
  [K in (typeof STRING_SUPPORTED_FORMATS)[number]]?: true;
} = {
  email: true,
} as const;

export const STRING_FORMAT_CONVERTERS: Record<
  (typeof STRING_SUPPORTED_FORMATS)[number],
  (schema: JSONSchema) => z.ZodType
> = {
  email: () => z.email(),
  date: ({ formatMinimum, formatMaximum }) => {
    let base = z.coerce.date();

    if (formatMinimum && typeof formatMinimum === "string") {
      base = base.min(new Date(formatMinimum), {
        error: `Date must be greater than or equal to ${formatMinimum}`,
      });
    }

    if (formatMaximum && typeof formatMaximum === "string") {
      base = base.max(new Date(formatMaximum), {
        error: `Date must be less than or equal to ${formatMaximum}`,
      });
    }

    return base;
  },
  time: timeSchemaWithBounds,
  "date-time": dateTimeSchemaWithBounds,
  uuid: () => z.uuidv4(),
};

/**
 * Checks if the provided format is a supported string format.
 * @param format - The format to check.
 * @returns True if the format is supported, otherwise false.
 */
export function isSupportedStringFormat(
  format: string,
): format is (typeof STRING_SUPPORTED_FORMATS)[number] {
  return STRING_SUPPORTED_FORMATS.includes(
    format as (typeof STRING_SUPPORTED_FORMATS)[number],
  );
}

export const StringConverter: Converter = {
  /**
   * Converts a JSON schema of type "string" to a Zod schema.
   * @param schema - The JSON schema to convert.
   * @returns The Zod schema for the string type.
   */
  convert: (schema) => {
    const { minLength, maxLength, pattern, format } = schema;
    let zodSchema = z.string();

    if (minLength !== undefined) {
      zodSchema = zodSchema.min(minLength);
    }

    if (maxLength !== undefined) {
      zodSchema = zodSchema.max(maxLength);
    }

    if (pattern !== undefined) {
      zodSchema = zodSchema.regex(new RegExp(pattern));
    }

    if (format && isSupportedStringFormat(format)) {
      if (STRING_FORMAT_ALLOWING_INTERSECTION[format])
        return z.intersection(
          zodSchema,
          STRING_FORMAT_CONVERTERS[format](schema),
        );
      return STRING_FORMAT_CONVERTERS[format](schema);
    }

    return zodSchema;
  },

  /**
   * Checks if the provided JSON schema is of type "string".
   *
   * If "string" is not strictly defined in the schema,
   * it will try to infer it based on the presence of properties typical for string schemas, such as `minLength`, `maxLength`, `pattern`, or `format`.
   *
   * @param schema - The JSON schema to check.
   * @returns True if the schema is a string schema, otherwise false.
   */
  is: (schema) => {
    return (
      schema.type === STRING_TYPE ||
      STRING_PROPERTIES.some((prop) => prop in schema)
    );
  },
};
