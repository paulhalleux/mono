import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

import {
  ImplicitStringHandler,
  MaxLengthHandler,
  MinLengthHandler,
  PatternHandler,
} from "./converters/string";
import { TypeHandler } from "./converters/type";
import { PrimitiveHandler, PrimitiveHandlerContext } from "./types";

const PRIMITIVE_CONVERTERS: PrimitiveHandler[] = [
  TypeHandler,

  ImplicitStringHandler,

  MinLengthHandler,
  MaxLengthHandler,
  PatternHandler,
];

export const convert = (schema: JSONSchema | boolean): z.ZodType => {
  if (typeof schema === "boolean") {
    return schema ? z.any() : z.never();
  }

  const context: PrimitiveHandlerContext = {
    types: {},
  };

  for (const converter of PRIMITIVE_CONVERTERS) {
    converter.apply(schema, context);
  }

  const schemas: z.ZodTypeAny[] = [];

  if (context.types.string !== false) {
    schemas.push(context.types.string || z.string());
  }
  if (context.types.number !== false) {
    schemas.push(context.types.number || z.number());
  }
  if (context.types.boolean !== false) {
    schemas.push(context.types.boolean || z.boolean());
  }
  if (context.types.null !== false) {
    schemas.push(context.types.null || z.null());
  }
  if (context.types.array !== false) {
    schemas.push(context.types.array || z.array(z.any()));
  }
  if (context.types.object !== false) {
    if (context.types.object) {
      // Use the explicit object schema from handlers
      schemas.push(context.types.object);
    } else {
      // Use custom validator that rejects arrays for default object schema
      const objectSchema = z.custom<object>((val) => {
        return typeof val === "object" && val !== null && !Array.isArray(val);
      }, "Must be an object, not an array");
      schemas.push(objectSchema);
    }
  }

  let zodSchema: z.ZodTypeAny;
  if (schemas.length === 0) {
    zodSchema = z.never();
  } else if (schemas.length === 1) {
    zodSchema = schemas[0];
  } else {
    zodSchema = z.union(schemas);
  }

  return zodSchema;
};
