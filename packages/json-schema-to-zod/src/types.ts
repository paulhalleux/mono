import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

export interface Converter {
  /**
   * Converts a JSON schema to a Zod schema.
   * @param schema - The JSON schema to convert.
   * @returns The Zod schema.
   */
  convert: (schema: JSONSchema) => z.ZodType;

  /**
   * Checks if the provided JSON schema is of the type this converter handles.
   * @param schema - The JSON schema to check.
   * @returns True if the schema is of the type this converter handles, otherwise false.
   */
  is: (schema: JSONSchema) => boolean;
}
