import { z } from "zod";

import { PrimitiveHandler } from "../types";

export const TypeHandler: PrimitiveHandler = {
  apply: (schema, context) => {
    if (!schema.type) return;

    const allowedTypes = Array.isArray(schema.type)
      ? schema.type
      : [schema.type];
    const typeSet = new Set(allowedTypes);

    if (!typeSet.has("string")) {
      context.types.string = false;
    }
    if (!typeSet.has("number") && !typeSet.has("integer")) {
      context.types.number = false;
    }
    if (!typeSet.has("boolean")) {
      context.types.boolean = false;
    }
    if (!typeSet.has("null")) {
      context.types.null = false;
    }
    if (!typeSet.has("array")) {
      context.types.array = false;
    }
    if (!typeSet.has("object")) {
      context.types.object = false;
    }

    // For integer type, ensure number schema with int constraint
    if (typeSet.has("integer") && context.types.number !== false) {
      const currentNumber = context.types.number || z.number();
      if (currentNumber instanceof z.ZodNumber) {
        context.types.number = currentNumber.int();
      }
    }
  },
};
