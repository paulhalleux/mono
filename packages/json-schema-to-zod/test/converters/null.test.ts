import { describe, expect, test } from "bun:test";
import { JSONSchema } from "zod/v4/core/json-schema";

import { NullConverter } from "../../src/converters/null";

describe("converters/null", () => {
  describe("is", () => {
    test("should return true for null schemas", () => {
      const schema: JSONSchema = {
        type: "null",
      };
      expect(NullConverter.is(schema)).toBe(true);
    });

    test("should return false for non-null schemas", () => {
      const schema: JSONSchema = {
        type: "string",
      };
      expect(NullConverter.is(schema)).toBe(false);
    });
  });

  describe("validation", () => {
    test("should validate null values", () => {
      const schema: JSONSchema = {
        type: "null",
      };

      const zodSchema = NullConverter.convert(schema);

      expect(zodSchema.safeParse(null).success).toBe(true);
    });

    test("should not validate non-null values", () => {
      const schema: JSONSchema = {
        type: "null",
      };

      const zodSchema = NullConverter.convert(schema);

      expect(zodSchema.safeParse("not null").success).toBe(false);
      expect(zodSchema.safeParse(123).success).toBe(false);
      expect(zodSchema.safeParse({}).success).toBe(false);
    });
  });
});
