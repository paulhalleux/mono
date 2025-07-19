import { z } from "zod";

import { Converter } from "../types";

export const NUMERIC_TYPES = ["number", "integer"];
export const NUMERIC_PROPERTIES = [
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
] as const;

export const NumericConverter: Converter = {
  /**
   * Converts a JSON schema of type "number" or "integer" to a Zod schema.
   * @param schema - The JSON schema to convert.
   * @returns The Zod schema for the numeric type.
   */
  convert: (schema) => {
    const {
      type,
      minimum,
      maximum,
      exclusiveMinimum,
      exclusiveMaximum,
      multipleOf,
    } = schema;

    let zodSchema: z.ZodType;
    let zodNumberSchema = type === "integer" ? z.int() : z.number();

    if (minimum !== undefined) {
      zodNumberSchema = zodNumberSchema.min(
        exclusiveMinimum !== undefined ? exclusiveMinimum + 1 : minimum,
      );
    }

    if (maximum !== undefined) {
      zodNumberSchema = zodNumberSchema.max(
        exclusiveMaximum !== undefined ? exclusiveMaximum - 1 : maximum,
      );
    }

    if (multipleOf !== undefined) {
      zodNumberSchema = zodNumberSchema.multipleOf(multipleOf);
    }

    zodSchema = zodNumberSchema;

    return zodSchema;
  },

  /**
   * Checks if the provided schema is a numeric type.
   * @param schema - The JSON schema to check.
   * @returns True if the schema is a numeric type, otherwise false.
   */
  is: (schema) => {
    return (
      (schema.type && NUMERIC_TYPES.includes(schema.type)) ||
      NUMERIC_PROPERTIES.some((prop) => prop in schema)
    );
  },
};
