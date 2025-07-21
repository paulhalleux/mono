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
      context.disableType("string");
    }
    if (!typeSet.has("number") && !typeSet.has("integer")) {
      context.disableType("numeric");
    }
    if (!typeSet.has("boolean")) {
      context.disableType("boolean");
    }
    if (!typeSet.has("null")) {
      context.disableType("null");
    }
    if (!typeSet.has("array")) {
      context.disableType("array");
    }
    if (!typeSet.has("object")) {
      context.disableType("object");
    }

    // For integer type, ensure number schema with int constraint
    if (typeSet.has("integer") && !context.isTypeDisabled("numeric")) {
      const currentNumber = context.types.numeric || z.number();
      if (currentNumber instanceof z.ZodNumber) {
        context.types.numeric = currentNumber.int();
      }
    }
  },
};
