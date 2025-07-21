import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

export type GetSchemaTypeByTypeName<
  T extends keyof TypeSchemas,
  Typed = {
    string: z.ZodString;
    numeric: z.ZodNumber;
    boolean: z.ZodBoolean;
    null: z.ZodNull;
    array: z.ZodArray<z.ZodTypeAny>;
    tuple: z.ZodTuple<z.ZodTypeAny[]>;
    object: z.ZodObject<Record<string, z.ZodTypeAny>>;
  }[T],
> = Typed extends z.ZodTypeAny ? Typed : z.ZodTypeAny;

export type TypeSchemas = {
  string?: z.ZodTypeAny | false;
  numeric?: z.ZodTypeAny | false;
  boolean?: z.ZodTypeAny | false;
  null?: z.ZodTypeAny | false;
  array?: z.ZodTypeAny | false;
  tuple?: z.ZodTypeAny | false;
  object?: z.ZodTypeAny | false;
};

export interface PrimitiveHandlerContext {
  types: TypeSchemas;
  isTypeDisabled(type: keyof TypeSchemas): boolean;
  disableType(type: keyof TypeSchemas): void;
  set<
    Type extends keyof TypeSchemas,
    SchemaType extends z.ZodTypeAny = GetSchemaTypeByTypeName<Type>,
  >(
    type: Type,
    schema: SchemaType | undefined,
  ): void;
  enrich<
    Type extends keyof TypeSchemas,
    SchemaType extends z.ZodTypeAny = GetSchemaTypeByTypeName<Type>,
  >(
    type: Type,
    callback: (schema: SchemaType) => SchemaType,
  ): void;
}

export interface PrimitiveHandler {
  apply: (schema: JSONSchema, context: PrimitiveHandlerContext) => void;
}

export interface RefinementHandler {
  refine: (
    schema: JSONSchema,
    zodSchema: z.ZodTypeAny,
  ) => z.ZodTypeAny | undefined;
}
