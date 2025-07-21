import { z } from "zod";

import { PrimitiveHandler } from "../../types";

export const EnumHandler: PrimitiveHandler = {
  apply(schema, context): void {
    if (schema.enum === undefined) {
      return;
    }

    // If enum is empty, disable all types only if no type is specified
    // otherwise, enum is interpreted as a not present
    if (schema.enum.length === 0) {
      if (!schema.type) {
        context.disableType("string");
        context.disableType("numeric");
        context.disableType("boolean");
        context.disableType("null");
        context.disableType("array");
        context.disableType("object");
        context.disableType("tuple");
      }
      return;
    }

    const valuesByType = {
      string: schema.enum.filter((v) => typeof v === "string"),
      number: schema.enum.filter((v) => typeof v === "number"),
      boolean: schema.enum.filter((v) => typeof v === "boolean"),
      null: schema.enum.filter((v) => v === null),
      array: schema.enum.filter((v) => Array.isArray(v)),
      object: schema.enum.filter(
        (v) => typeof v === "object" && v !== null && !Array.isArray(v),
      ),
    };

    // String handling, either literal or enum
    if (valuesByType.string.length > 0) {
      if (valuesByType.string.length === 1) {
        context.set("string", z.literal(valuesByType.string[0]));
      } else {
        context.set("string", z.enum(valuesByType.string));
      }
    } else context.disableType("string");

    // Numeric handling, either literal or union of numeric literals
    if (valuesByType.number.length > 0) {
      if (valuesByType.number.length === 1) {
        context.set("numeric", z.literal(valuesByType.number[0]));
      } else {
        context.set(
          "numeric",
          z.union(valuesByType.number.map((v) => z.literal(v))),
        );
      }
    } else context.disableType("numeric");

    // Boolean handling, either literal or union of boolean literals
    if (valuesByType.boolean.length > 0) {
      if (valuesByType.boolean.length === 1) {
        context.set("boolean", z.literal(valuesByType.boolean[0]));
      } else {
        context.set(
          "boolean",
          z.union(valuesByType.boolean.map((v) => z.literal(v))),
        );
      }
    } else context.disableType("boolean");

    // Null handling
    if (valuesByType.null.length > 0) context.set("null", z.null());
    else context.disableType("null");

    // Array handling, not handled here as requires refining the full schema, not a single primitive
    if (valuesByType.array.length > 0) context.set("array", undefined);
    else context.disableType("array");

    // Object handling, not handled here as requires refining the full schema, not a single primitive
    if (valuesByType.object.length > 0) context.set("object", undefined);
    else context.disableType("object");
  },
};
