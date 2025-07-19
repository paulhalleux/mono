import { describe, expect, test } from "bun:test";
import { JSONSchema } from "zod/v4/core/json-schema";

import { NumericConverter } from "../../src/converters/numeric";

describe("converters/numeric", () => {
  describe("is", () => {
    test("should return true for numeric schemas", () => {
      const schema: JSONSchema = {
        type: "number",
      };
      expect(NumericConverter.is(schema)).toBe(true);
    });

    test("should return false for non-numeric schemas", () => {
      const schema: JSONSchema = {
        type: "string",
      };
      expect(NumericConverter.is(schema)).toBe(false);
    });

    test("should return true if properties are present", () => {
      const schema: JSONSchema = {
        type: "number",
        minimum: 0,
        maximum: 100,
        multipleOf: 5,
      };
      expect(NumericConverter.is(schema)).toBe(true);
    });

    test("should return false if empty schema", () => {
      const schema: JSONSchema = {};
      expect(NumericConverter.is(schema)).toBe(false);
    });

    test("should return true if enum with numeric values", () => {
      const schema: JSONSchema = {
        enum: [1, 2, 3],
      };
      expect(NumericConverter.is(schema)).toBe(true);
    });
  });

  describe("validation", () => {
    describe("number", () => {
      test("should validate a number schema with minimum and maximum", () => {
        const schema: JSONSchema = {
          type: "number",
          minimum: 0,
          maximum: 100,
        };

        const zodSchema = NumericConverter.convert(schema);

        expect(zodSchema.safeParse(50).success).toBe(true);
        expect(zodSchema.safeParse(-1).success).toBe(false);
        expect(zodSchema.safeParse(101).success).toBe(false);
      });

      test("should validate a number schema with multipleOf", () => {
        const schema: JSONSchema = {
          type: "number",
          multipleOf: 5,
        };

        const zodSchema = NumericConverter.convert(schema);

        expect(zodSchema.safeParse(10).success).toBe(true);
        expect(zodSchema.safeParse(12).success).toBe(false);
      });

      test("should validate a number schema with minimum, maximum, and multipleOf", () => {
        const schema: JSONSchema = {
          type: "number",
          minimum: 10,
          maximum: 50,
          multipleOf: 5,
        };

        const zodSchema = NumericConverter.convert(schema);

        expect(zodSchema.safeParse(15).success).toBe(true);
        expect(zodSchema.safeParse(9).success).toBe(false);
        expect(zodSchema.safeParse(51).success).toBe(false);
        expect(zodSchema.safeParse(22).success).toBe(false);
      });

      test("should validate a number schema with no constraints", () => {
        const schema: JSONSchema = {
          type: "number",
        };

        const zodSchema = NumericConverter.convert(schema);

        expect(zodSchema.safeParse(0).success).toBe(true);
        expect(zodSchema.safeParse(3.14).success).toBe(true);
        expect(zodSchema.safeParse(-1).success).toBe(true);
      });
    });

    describe("integer", () => {
      test("should validate an integer schema with minimum and maximum", () => {
        const schema: JSONSchema = {
          type: "integer",
          minimum: 0,
          maximum: 100,
        };

        const zodSchema = NumericConverter.convert(schema);

        expect(zodSchema.safeParse(50).success).toBe(true);
        expect(zodSchema.safeParse(-1).success).toBe(false);
        expect(zodSchema.safeParse(101).success).toBe(false);
      });

      test("should validate an integer schema with multipleOf", () => {
        const schema: JSONSchema = {
          type: "integer",
          multipleOf: 5,
        };

        const zodSchema = NumericConverter.convert(schema);

        expect(zodSchema.safeParse(10).success).toBe(true);
        expect(zodSchema.safeParse(12).success).toBe(false);
      });

      test("should validate an integer schema with minimum, maximum, and multipleOf", () => {
        const schema: JSONSchema = {
          type: "integer",
          minimum: 10,
          maximum: 50,
          multipleOf: 5,
        };

        const zodSchema = NumericConverter.convert(schema);

        expect(zodSchema.safeParse(15).success).toBe(true);
        expect(zodSchema.safeParse(9).success).toBe(false);
        expect(zodSchema.safeParse(51).success).toBe(false);
        expect(zodSchema.safeParse(22).success).toBe(false);
      });

      test("should validate an integer schema with no constraints", () => {
        const schema: JSONSchema = {
          type: "integer",
        };

        const zodSchema = NumericConverter.convert(schema);

        expect(zodSchema.safeParse(0).success).toBe(true);
        expect(zodSchema.safeParse(3.14).success).toBe(false); // Should fail for non-integer
        expect(zodSchema.safeParse(-1).success).toBe(true);
      });
    });
  });

  describe("enum", () => {
    test("should validate a number schema with enum values", () => {
      const schema: JSONSchema = {
        type: "number",
        enum: [1, 2, 3, 4.5, -8.62],
      };

      const zodSchema = NumericConverter.convert(schema);

      expect(zodSchema.safeParse(1).success).toBe(true);
      expect(zodSchema.safeParse(2).success).toBe(true);
      expect(zodSchema.safeParse(3).success).toBe(true);
      expect(zodSchema.safeParse(4).success).toBe(false);
      expect(zodSchema.safeParse(4.5).success).toBe(true);
      expect(zodSchema.safeParse(-8.62).success).toBe(true);
    });

    test("should validate an integer schema with enum values", () => {
      const schema: JSONSchema = {
        type: "integer",
        enum: [1, 2, 3, 4.5, -8.62],
      };

      const zodSchema = NumericConverter.convert(schema);

      expect(zodSchema.safeParse(1).success).toBe(true);
      expect(zodSchema.safeParse(2).success).toBe(true);
      expect(zodSchema.safeParse(3).success).toBe(true);
      expect(zodSchema.safeParse(4.5).success).toBe(false); // Should fail for non-integer
      expect(zodSchema.safeParse(-8.62).success).toBe(false); // Should fail for non-integer
      expect(zodSchema.safeParse(5).success).toBe(false);
    });
  });
});
