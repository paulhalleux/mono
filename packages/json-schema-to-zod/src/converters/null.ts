import { z } from "zod";

import { Converter } from "../types";

export const NULL_TYPE = "null";

export const NullConverter: Converter = {
  /**
   * Converts a JSON schema of type 'null' to a Zod schema.
   * @returns A Zod schema that represents a null value.
   */
  convert: () => {
    return z.null();
  },

  /**
   * Checks if the provided schema is a boolean type.
   * @param schema - The JSON schema to check.
   * @returns True if the schema is a boolean type, otherwise false.
   */
  is: (schema) => {
    return schema.type === NULL_TYPE;
  },
};
