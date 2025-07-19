import { z } from "zod";

import { Converter } from "../types";

import { convertSchemaToZod } from "./schema";

export const MultipleTypesConverter: Converter = {
  /**
   * Converts a JSON schema with multiple types to a Zod schema.
   * @param schema - The JSON schema to convert.
   * @returns A Zod schema that accepts any of the specified types.
   */
  convert: (schema) => {
    const { type, ...rest } = schema;

    if (!Array.isArray(type)) {
      return z.unknown();
    }

    return type.reduce((acc, currentType) => {
      return acc.or(
        convertSchemaToZod({
          type: currentType,
          ...rest,
        }),
      );
    }, z.symbol("__no-match"));
  },

  /**
   * Checks if the schema is a multiple types schema.
   * @param schema - The JSON schema to check.
   * @returns True if the schema has a type that is an array, false otherwise.
   */
  is: (schema) => {
    return schema.type !== undefined && Array.isArray(schema.type);
  },
};
