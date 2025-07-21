import { z } from "zod";

import { PrimitiveHandler } from "../../types";

export const ConstHandler: PrimitiveHandler = {
  apply(schema, context): void {
    if (schema.const === undefined) {
      return;
    }

    context.disableType("string");
    context.disableType("numeric");
    context.disableType("boolean");
    context.disableType("null");
    context.disableType("array");
    context.disableType("object");
    context.disableType("tuple");

    const value = schema.const;

    // Handle primitive const values
    // Arrays and objects are not handled here as require a full schema refinement
    if (typeof value === "string") {
      context.set("string", z.literal(value));
    } else if (typeof value === "number") {
      context.set("numeric", z.literal(value));
    } else if (typeof value === "boolean") {
      context.set("boolean", z.literal(value));
    } else if (value === null) {
      context.set("null", z.null());
    } else if (Array.isArray(value)) {
      context.set("array", undefined);
    } else if (typeof value === "object") {
      context.set("object", undefined);
    }
  },
};
