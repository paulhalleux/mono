import { z } from "zod";

import { Converter } from "../types";

export const ConstConverter: Converter = {
  /**
   * Converts a JSON Schema `const` keyword to a Zod literal type.
   * @param schema - The JSON Schema object containing the `const` keyword.
   * @return A Zod schema that represents the constant value defined in the JSON Schema.
   */
  convert: (schema) => {
    const { const: _const } = schema;
    return z.literal(_const);
  },

  /**
   * Checks if the provided schema contains a `const` keyword.
   * @param schema - The JSON Schema object to check.
   * @return A boolean indicating whether the schema has a `const` keyword.
   */
  is: (schema) => {
    return schema.const !== undefined;
  },
};
