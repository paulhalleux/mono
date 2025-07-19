import { z } from "zod";

import { PrimitiveHandler } from "../types";

export const ImplicitStringHandler: PrimitiveHandler = {
  apply(schema, context): void {
    if (
      schema.type === undefined &&
      (schema.minLength !== undefined ||
        schema.maxLength !== undefined ||
        schema.pattern !== undefined)
    ) {
      if (context.types.string === undefined) {
        context.types.string = z.string();
      }
    }
  },
};

export const MinLengthHandler: PrimitiveHandler = {
  apply(schema, context): void {
    if (schema.minLength === undefined) return;
    if (context.types.string !== false) {
      const currentString = context.types.string || z.string();
      if (currentString instanceof z.ZodString) {
        context.types.string = currentString.refine(
          (value: string) => {
            const graphemeLength = Array.from(value).length;
            return graphemeLength >= schema.minLength!;
          },
          {
            message: `String must be at least ${schema.minLength} characters long`,
          },
        );
      }
    }
  },
};

export const MaxLengthHandler: PrimitiveHandler = {
  apply(schema, context): void {
    if (schema.maxLength === undefined) return;
    if (context.types.string !== false) {
      const currentString = context.types.string || z.string();
      if (currentString instanceof z.ZodString) {
        context.types.string = currentString.refine(
          (value: string) => {
            const graphemeLength = Array.from(value).length;
            return graphemeLength <= schema.maxLength!;
          },
          {
            message: `String must be at most ${schema.maxLength} characters long`,
          },
        );
      }
    }
  },
};

export const PatternHandler: PrimitiveHandler = {
  apply(schema, context): void {
    if (schema.pattern === undefined) return;
    if (context.types.string !== false) {
      const currentString = context.types.string || z.string();
      if (currentString instanceof z.ZodString) {
        context.types.string = currentString.regex(new RegExp(schema.pattern));
      }
    }
  },
};
