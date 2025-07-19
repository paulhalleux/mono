import { describe, expect, test } from "bun:test";
import { JSONSchema } from "zod/v4/core/json-schema";

import { ArrayConverter } from "../../src/converters/array";

describe("converters/array", () => {
  describe("is", () => {
    test("should return true for schema with array type", () => {
      const schema: JSONSchema = { type: "array" };
      expect(ArrayConverter.is(schema)).toBe(true);
    });

    test("should return false for non array type", () => {
      const schema: JSONSchema = { type: "string" };
      expect(ArrayConverter.is(schema)).toBe(false);
    });

    test("should return true if contain array properties", () => {
      const schema: JSONSchema = {
        items: { type: "string" },
      };

      expect(ArrayConverter.is(schema)).toBe(true);
    });
  });

  describe("validation", () => {
    test("should validate array with items", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
      };

      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse(["test", "example"]).success).toBe(true);
    });

    test("should validate array with minItems", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
        minItems: 2,
      };

      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse(["test", "example"]).success).toBe(true);
      expect(zodSchema.safeParse(["test"]).success).toBe(false);
    });

    test("should validate array with maxItems", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
        maxItems: 2,
      };

      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse(["test", "example"]).success).toBe(true);
      expect(zodSchema.safeParse(["test", "example", "extra"]).success).toBe(
        false,
      );
    });

    test("should validate array with minItems and maxItems", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 3,
      };

      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse(["test"]).success).toBe(true);
      expect(zodSchema.safeParse(["test", "example"]).success).toBe(true);
      expect(zodSchema.safeParse(["test", "example", "extra"]).success).toBe(
        true,
      );
      expect(zodSchema.safeParse([]).success).toBe(false);
      expect(
        zodSchema.safeParse(["test", "example", "extra", "more"]).success,
      ).toBe(false);
    });

    test("should validate array with uniqueItems", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
        uniqueItems: true,
      };

      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse(["test", "example"]).success).toBe(true);
      expect(zodSchema.safeParse(["test", "test"]).success).toBe(false);
    });

    test("should validate array with contains", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
        contains: { type: "string", enum: ["test"] },
      };

      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse(["test", "example"]).success).toBe(true);
      expect(zodSchema.safeParse(["example"]).success).toBe(false);
    });

    test("should validate array with minContains", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
        contains: { type: "string", enum: ["test"] },
        minContains: 1,
      };

      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse(["test", "example"]).success).toBe(true);
      expect(zodSchema.safeParse(["example"]).success).toBe(false);
    });

    test("should validate array with maxContains", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
        contains: { type: "string", enum: ["test"] },
        maxContains: 1,
      };

      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse(["test", "example"]).success).toBe(true);
      expect(zodSchema.safeParse(["test", "test"]).success).toBe(false);
    });

    test("should validate array with minContains and maxContains", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
        contains: { type: "string", enum: ["test"] },
        minContains: 1,
        maxContains: 2,
      };

      const zodSchema = ArrayConverter.convert(schema);
      expect(zodSchema.safeParse(["test", "example"]).success).toBe(true);
      expect(zodSchema.safeParse(["test", "test"]).success).toBe(true);
      expect(zodSchema.safeParse(["example"]).success).toBe(false);
      expect(zodSchema.safeParse(["test", "test", "test"]).success).toBe(false);
    });

    test("should validate array with all constraints", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 3,
        uniqueItems: true,
        contains: { type: "string", enum: ["test"] },
        minContains: 1,
        maxContains: 2,
      };

      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse(["test", "example"]).success).toBe(true);
      expect(zodSchema.safeParse(["test", "test"]).success).toBe(false);
      expect(zodSchema.safeParse(["example"]).success).toBe(false);
      expect(zodSchema.safeParse(["test", "example", "extra"]).success).toBe(
        true,
      );
      expect(
        zodSchema.safeParse(["test", "example", "extra", "more"]).success,
      ).toBe(false);
    });

    test("should not validate array with invalid items", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
      };

      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse([1, 2, 3]).success).toBe(false);
      expect(zodSchema.safeParse(["test", 123]).success).toBe(false);
    });

    test("should handle empty array schema", () => {
      const schema: JSONSchema = { type: "array" };
      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse([]).success).toBe(true);
      expect(zodSchema.safeParse(["test"]).success).toBe(true);
    });

    test("should handle array with items as an empty object", () => {
      const schema: JSONSchema = { type: "array", items: {} };
      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse([]).success).toBe(true);
      expect(zodSchema.safeParse(["test"]).success).toBe(true);
      expect(zodSchema.safeParse([1, 2, 3]).success).toBe(true);
    });

    test("should validate array with enum items", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string", enum: ["test", "example"] },
      };

      const zodSchema = ArrayConverter.convert(schema);

      expect(zodSchema.safeParse(["test", "example"]).success).toBe(true);
      expect(zodSchema.safeParse(["test", "invalid"]).success).toBe(false);
      expect(zodSchema.safeParse(["example"]).success).toBe(true);
    });
  });
});
