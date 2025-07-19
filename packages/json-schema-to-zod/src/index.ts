import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

import { convertSchemaToZod } from "./converters/schema";

export const JsonSchemaToZod = {
  /**
   * Converts a JSON Schema to a Zod schema.
   * @param schema - The JSON Schema to convert.
   * @returns The Zod schema.
   */
  convert: (schema: JSONSchema): z.ZodType => {
    return convertSchemaToZod(schema);
  },
};
