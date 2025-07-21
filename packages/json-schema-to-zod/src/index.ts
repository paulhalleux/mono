import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

import { ConstHandler } from "./converters/primitives/const";
import { EnumHandler } from "./converters/primitives/enum";
import {
  MaximumHandler,
  MinimumHandler,
  MultipleOfHandler,
} from "./converters/primitives/numeric";
import {
  ImplicitObjectHandler,
  MaxPropertiesHandler,
  MinPropertiesHandler,
  PropertiesHandler,
  PropertyNamesHandler,
  RequiredPropertiesHandler,
} from "./converters/primitives/object";
import {
  ImplicitStringHandler,
  MaxLengthHandler,
  MinLengthHandler,
  PatternHandler,
} from "./converters/primitives/string";
import { ConstRefinementHandler } from "./converters/refinement/const";
import { EnumRefinementHandler } from "./converters/refinement/enum";
import { NotRefinementHandler } from "./converters/refinement/not";
import { TypeHandler } from "./converters/type";
import { createPrimitiveHandlerContext } from "./context";
import { PrimitiveHandler, RefinementHandler } from "./types";

const PRIMITIVE_HANDLERS: PrimitiveHandler[] = [
  // Explicit type handlers
  ConstHandler,
  EnumHandler,
  TypeHandler,

  // Implicit type handlers
  ImplicitStringHandler,
  ImplicitObjectHandler,

  // String-specific keyword handlers
  MinLengthHandler,
  MaxLengthHandler,
  PatternHandler,

  // Numeric-specific keyword handlers
  MinimumHandler,
  MaximumHandler,
  MultipleOfHandler,

  // Object-specific keyword handlers
  MinPropertiesHandler,
  MaxPropertiesHandler,
  RequiredPropertiesHandler,
  PropertyNamesHandler,
  PropertiesHandler,
];

const REFINEMENT_HANDLERS: RefinementHandler[] = [
  ConstRefinementHandler,
  EnumRefinementHandler,
  NotRefinementHandler,
];

export const convert = (schema: JSONSchema | boolean): z.ZodType => {
  if (typeof schema === "boolean") {
    return schema ? z.any() : z.never();
  }

  const context = createPrimitiveHandlerContext();

  for (const converter of PRIMITIVE_HANDLERS) {
    converter.apply(schema, context);
  }

  const schemas: z.ZodTypeAny[] = [];

  if (!context.isTypeDisabled("string")) {
    schemas.push(context.types.string || z.string());
  }

  if (!context.isTypeDisabled("numeric")) {
    schemas.push(context.types.numeric || z.number());
  }

  if (!context.isTypeDisabled("boolean")) {
    schemas.push(context.types.boolean || z.boolean());
  }

  if (!context.isTypeDisabled("null")) {
    schemas.push(context.types.null || z.null());
  }

  if (!context.isTypeDisabled("array")) {
    schemas.push(context.types.array || z.array(z.any()));
  }

  if (!context.isTypeDisabled("tuple") && context.types.tuple !== undefined) {
    schemas.push(context.types.tuple || z.array(z.any()));
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

  // Apply refinements
  for (const handler of REFINEMENT_HANDLERS) {
    const refinedSchema = handler.refine(schema, zodSchema);
    if (refinedSchema) {
      zodSchema = refinedSchema;
    }
  }

  return zodSchema;
};
