import { z } from "zod";

import { PrimitiveHandler } from "../../types";

const STRING_KEYWORDS = ["minLength", "maxLength", "pattern"];

export const ImplicitStringHandler: PrimitiveHandler = {
  apply(schema, context): void {
    // Do not infer a string type if the schema explicitly defines a type or has no string-related keywords.
    if (
      schema.type !== undefined ||
      !STRING_KEYWORDS.some((keyword) => schema[keyword] !== undefined)
    ) {
      return;
    }

    // If not already defined, create a default string schema.
    if (context.types.string === undefined) {
      context.set("string", z.string());
    }
  },
};

export const MinLengthHandler: PrimitiveHandler = {
  apply(schema, context): void {
    const { minLength } = schema;
    if (context.isTypeDisabled("string") || minLength === undefined) {
      return;
    }

    // Use grapheme length to ensure correct character counting.
    context.enrich("string", (currentString) => {
      return currentString.refine(
        (value) => {
          const graphemeLength = Array.from(value).length;
          return graphemeLength >= minLength!;
        },
        {
          message: `String must be at least ${minLength} characters long`,
        },
      );
    });
  },
};

export const MaxLengthHandler: PrimitiveHandler = {
  apply(schema, context): void {
    const { maxLength } = schema;
    if (context.isTypeDisabled("string") || maxLength === undefined) {
      return;
    }

    // Use grapheme length to ensure correct character counting.
    context.enrich("string", (currentString) => {
      return currentString.refine(
        (value: string) => {
          const graphemeLength = Array.from(value).length;
          return graphemeLength <= maxLength!;
        },
        {
          message: `String must be at most ${maxLength} characters long`,
        },
      );
    });
  },
};

export const PatternHandler: PrimitiveHandler = {
  apply(schema, context): void {
    const { pattern } = schema;
    if (context.isTypeDisabled("string") || pattern === undefined) {
      return;
    }

    context.enrich("string", (currentString) => {
      return currentString.regex(new RegExp(pattern));
    });
  },
};
