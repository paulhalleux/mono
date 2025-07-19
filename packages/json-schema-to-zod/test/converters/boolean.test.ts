import { describe, expect, test } from "bun:test";
import { JSONSchema } from "zod/v4/core/json-schema";

import { BooleanConverter } from "../../src/converters/boolean";

describe("converters/boolean", () => {
  describe("is", () => {
    test("should return true for boolean schemas", () => {
      const schema: JSONSchema = {
        type: "boolean",
      };
      expect(BooleanConverter.is(schema)).toBe(true);
    });

    test("should return false for non-boolean schemas", () => {
      const schema: JSONSchema = {
        type: "string",
      };
      expect(BooleanConverter.is(schema)).toBe(false);
    });

    test("should return true if enum with boolean values", () => {
      const schema: JSONSchema = {
        enum: [true, false],
      };
      expect(BooleanConverter.is(schema)).toBe(true);
    });
  });

  describe("validation", () => {
    test("should validate a boolean schema", () => {
      const schema: JSONSchema = {
        type: "boolean",
      };

      const zodSchema = BooleanConverter.convert(schema);

      expect(zodSchema.safeParse(true).success).toBe(true);
      expect(zodSchema.safeParse(false).success).toBe(true);
      expect(zodSchema.safeParse("true").success).toBe(false);
      expect(zodSchema.safeParse(1).success).toBe(false);
    });

    test("should handle empty schema", () => {
      const schema: JSONSchema = {};

      const zodSchema = BooleanConverter.convert(schema);

      expect(zodSchema.safeParse(true).success).toBe(true);
      expect(zodSchema.safeParse(false).success).toBe(true);
    });

    test("should handle enum with boolean values", () => {
      const schema: JSONSchema = {
        enum: [true, false],
      };

      const zodSchema = BooleanConverter.convert(schema);

      expect(zodSchema.safeParse(true).success).toBe(true);
      expect(zodSchema.safeParse(false).success).toBe(true);
      expect(zodSchema.safeParse("true").success).toBe(false);
      expect(zodSchema.safeParse(1).success).toBe(false);
    });
  });
});
