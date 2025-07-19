import { z } from "zod";
import { JSONSchema } from "zod/v4/core/json-schema";

export interface PrimitiveHandlerContext {
  types: {
    string?: z.ZodTypeAny | false;
    number?: z.ZodTypeAny | false;
    boolean?: z.ZodTypeAny | false;
    null?: z.ZodTypeAny | false;
    array?: z.ZodTypeAny | false;
    object?: z.ZodTypeAny | false;
  };
}

export interface PrimitiveHandler {
  apply: (schema: JSONSchema, context: PrimitiveHandlerContext) => void;
}
