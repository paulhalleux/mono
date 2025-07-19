import { z } from "zod";

import { Converter } from "../types";

export const BOOLEAN_TYPE = "boolean";

export const BooleanConverter: Converter = {
  /**
   * Converts a JSON schema of type "boolean" to a Zod schema.
   * @returns The Zod schema for the boolean type.
   */
  convert: (schema) => {
    const { enum: _enum } = schema;

    if (_enum !== undefined && Array.isArray(_enum)) {
      const validEnumValues = _enum.filter(
        (e) => e !== null && e !== undefined && typeof e === "boolean",
      );

      return z.union(validEnumValues.map((value) => z.literal(value)));
    }

    return z.boolean();
  },

  /**
   * Checks if the provided schema is a boolean type.
   * @param schema - The JSON schema to check.
   * @returns True if the schema is a boolean type, otherwise false.
   */
  is: (schema) => {
    return (
      schema.type === BOOLEAN_TYPE ||
      (schema.enum !== undefined &&
        schema.enum.every((e) => typeof e === "boolean"))
    );
  },
};
