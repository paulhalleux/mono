import { z } from "zod";

import {
  GetSchemaTypeByTypeName,
  PrimitiveHandlerContext,
  TypeSchemas,
} from "./types";

const getDefaultSchema = <Type extends keyof TypeSchemas>(
  type: Type,
): TypeSchemas[Type] => {
  switch (type) {
    case "string":
      return z.string();
    case "numeric":
      return z.number();
    case "boolean":
      return z.boolean();
    case "null":
      return z.null();
    case "array":
      return z.array(z.any());
    case "tuple":
      return z.tuple([]);
    case "object":
      return z.object().catchall(z.unknown());
    default:
      return z.unknown();
  }
};

export function createPrimitiveHandlerContext(): PrimitiveHandlerContext {
  const context: PrimitiveHandlerContext = {
    types: {},
    isTypeDisabled(type) {
      return context.types[type] === false;
    },
    disableType(type) {
      context.types[type] = false;
    },
    set(type, schema) {
      context.types[type] = schema;
    },
    enrich<
      Type extends keyof TypeSchemas,
      SchemaType extends z.ZodTypeAny = GetSchemaTypeByTypeName<Type>,
    >(type: Type, callback: (schema: SchemaType) => SchemaType) {
      let typeSchema = context.types[type];
      if (typeSchema === false) return;
      if (typeSchema === undefined) {
        const defaultSchema = getDefaultSchema(type);
        if (!defaultSchema) return;
        else typeSchema = defaultSchema;
      }
      context.types[type] = callback(typeSchema as SchemaType);
    },
  };

  return context;
}
