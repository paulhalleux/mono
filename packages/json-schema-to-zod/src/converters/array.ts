import { z } from "zod";

import { Converter } from "../types";

import { convertSchemaToZod } from "./schema";

export const ARRAY_TYPE = "array";

export const ARRAY_PROPERTIES = [
  "items",
  "minItems",
  "maxItems",
  "uniqueItems",
  "contains",
];

export const ArrayConverter: Converter = {
  /**
   * Converts a JSON Schema array type to a Zod schema.
   * @param schema - The JSON Schema object containing the array type.
   * @return A Zod schema that represents the array type defined in the JSON Schema.
   */
  convert: (schema) => {
    const {
      items,
      minItems,
      maxItems,
      uniqueItems,
      contains,
      minContains,
      maxContains,
    } = schema;
    let zodSchema: z.ZodArray = z.array(z.unknown());

    if (items && !Array.isArray(items) && typeof items === "object") {
      zodSchema = z.array(convertSchemaToZod(items));
    }

    if (minItems !== undefined) {
      zodSchema = zodSchema.min(minItems);
    }

    if (maxItems !== undefined) {
      zodSchema = zodSchema.max(maxItems);
    }

    if (uniqueItems) {
      zodSchema = zodSchema.refine((arr) => {
        const uniqueItems = new Set(arr);
        return uniqueItems.size === arr.length;
      });
    }

    if (contains && typeof contains === "object") {
      zodSchema = zodSchema.refine(
        (arr) => {
          const containsCount = arr.filter((item) => {
            const itemSchema = convertSchemaToZod(contains);
            return itemSchema.safeParse(item).success;
          }).length;

          if (minContains !== undefined && maxContains !== undefined) {
            return containsCount >= minContains && containsCount <= maxContains;
          }

          if (minContains !== undefined) {
            return containsCount >= minContains;
          }

          if (maxContains !== undefined) {
            return containsCount <= maxContains;
          }

          return containsCount > 0;
        },
        {
          message:
            "Array does not contain required items or does not meet contains constraints",
        },
      );
    }

    return zodSchema;
  },

  /**
   * Checks if the provided schema is an array type or has array properties.
   * @param schema - The JSON Schema object to check.
   * @return A boolean indicating whether the schema is an array type or has array properties.
   */
  is: (schema) => {
    return (
      schema.type === ARRAY_TYPE ||
      (schema.type === undefined &&
        ARRAY_PROPERTIES.some((prop) => prop in schema))
    );
  },
};
