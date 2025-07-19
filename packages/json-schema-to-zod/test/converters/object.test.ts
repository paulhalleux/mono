import { describe, expect, test } from "bun:test";
import { JSONSchema } from "zod/v4/core/json-schema";

import { ObjectConverter } from "../../src/converters/object";

describe("converters/object", () => {
  describe("is", () => {
    test("should return true for object schemas", () => {
      const schema: JSONSchema = {
        type: "object",
      };
      expect(ObjectConverter.is(schema)).toBe(true);
    });

    test("should return false for non-null schemas", () => {
      const schema: JSONSchema = {
        type: "string",
      };
      expect(ObjectConverter.is(schema)).toBe(false);
    });

    test("should return true for schemas with properties", () => {
      const schema: JSONSchema = {
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      };
      expect(ObjectConverter.is(schema)).toBe(true);
    });
  });

  describe("validation", () => {
    describe("properties", () => {
      test("should validate properties with correct types", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John", age: 30 }).success).toBe(
          true,
        );
      });

      test("should fail validation for incorrect property types", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: 24, age: "30" }).success).toBe(
          false,
        );
      });
    });

    describe("required properties", () => {
      test("should validate required properties", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          required: ["name"],
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John", age: 30 }).success).toBe(
          true,
        );
      });

      test("should fail validation for missing required properties", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          required: ["name"],
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ age: 30 }).success).toBe(false);
      });
    });

    describe("additional properties", () => {
      test("should allow additional properties by default", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          additionalProperties: true,
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John", age: 30 }).success).toBe(
          true,
        );
      });

      test("should disallow additional properties when set to false", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          additionalProperties: false,
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John", age: 30 }).success).toBe(
          false,
        );
      });

      test("should allow additional properties with a schema", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          additionalProperties: { type: "number" },
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John", age: 30 }).success).toBe(
          true,
        );
        expect(zodSchema.safeParse({ name: "John", age: "30" }).success).toBe(
          false,
        );
      });
    });

    describe("propertyNames", () => {
      test("should validate property names with a string pattern", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {},
          propertyNames: { pattern: "^[a-z]+$" },
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ validname: "value" }).success).toBe(true);
        expect(zodSchema.safeParse({ InvalidName: "value" }).success).toBe(
          false,
        );
      });

      test("should validate property names with a size", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {},
          propertyNames: { maxLength: 2 },
        };

        const zodSchema = ObjectConverter.convert(schema);

        expect(zodSchema.safeParse({ ok: "value" }).success).toBe(true);
        expect(zodSchema.safeParse({ 123: "value" }).success).toBe(false);
      });

      test("should validate property names in enum", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {},
          propertyNames: { enum: ["name", "age"] },
        };

        const zodSchema = ObjectConverter.convert(schema);

        expect(zodSchema.safeParse({ name: "John" }).success).toBe(true);
        expect(zodSchema.safeParse({ age: 30 }).success).toBe(true);
        expect(zodSchema.safeParse({ invalid: "value" }).success).toBe(false);
      });

      test("should validate property names with other object properties", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          propertyNames: { const: "age" },
        };

        const zodSchema = ObjectConverter.convert(schema);

        expect(zodSchema.safeParse({ name: "John" }).success).toBe(false);
        expect(zodSchema.safeParse({ age: 30 }).success).toBe(true);
      });
    });

    describe("minProperties and maxProperties", () => {
      test("should validate minProperties", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          minProperties: 2,
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John", age: 30 }).success).toBe(
          true,
        );
        expect(zodSchema.safeParse({ name: "John" }).success).toBe(false);
      });

      test("should validate maxProperties", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          maxProperties: 1,
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John" }).success).toBe(true);
        expect(zodSchema.safeParse({ name: "John", age: 30 }).success).toBe(
          false,
        );
      });

      test("should validate both minProperties and maxProperties", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          minProperties: 1,
          maxProperties: 2,
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John" }).success).toBe(true);
        expect(zodSchema.safeParse({ name: "John", age: 30 }).success).toBe(
          true,
        );
        expect(zodSchema.safeParse({}).success).toBe(false);
        expect(
          zodSchema.safeParse({ name: "John", age: 30, extra: true }).success,
        ).toBe(false);
      });
    });

    describe("patternProperties", () => {
      test("should validate patternProperties with a string pattern", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {},
          patternProperties: {
            "^[a-z]+$": { type: "string" },
          },
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ validname: "value" }).success).toBe(true);
        expect(zodSchema.safeParse({ InvalidName: "value" }).success).toBe(
          false,
        );
      });

      test("should validate patternProperties with a number pattern", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {},
          patternProperties: {
            "^[0-9]+$": { type: "number" },
          },
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ "123": 456 }).success).toBe(true);
        expect(zodSchema.safeParse({ abc: 456 }).success).toBe(false);
      });

      test("should validate patternProperties with multiple patterns", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {},
          patternProperties: {
            "^[a-z]+$": { type: "string" },
            "^[0-9]+$": { type: "number" },
          },
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ validname: "value" }).success).toBe(true);
        expect(zodSchema.safeParse({ "123": 456 }).success).toBe(true);
        expect(zodSchema.safeParse({ InvalidName: "value" }).success).toBe(
          false,
        );
        expect(zodSchema.safeParse({ abc: 456 }).success).toBe(false);
      });
    });

    describe("dependentRequired", () => {
      test("should validate dependent required properties", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          dependentRequired: {
            name: ["age"],
          },
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John", age: 30 }).success).toBe(
          true,
        );
        expect(zodSchema.safeParse({ name: "John" }).success).toBe(false);
      });

      test("should fail validation for missing dependent required properties", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          dependentRequired: {
            name: ["age"],
          },
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John" }).success).toBe(false);
      });
    });

    describe("dependentSchemas", () => {
      test("should validate dependent schemas", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          dependentSchemas: {
            name: {
              type: "object",
              properties: {
                age: { type: "number" },
              },
              required: ["age"],
            },
          },
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John", age: 30 }).success).toBe(
          true,
        );
        expect(zodSchema.safeParse({ name: "John" }).success).toBe(false);
        expect(zodSchema.safeParse({ name: "John", age: "marc" }).success).toBe(
          false,
        );
      });

      test("should fail validation for missing dependent schemas", () => {
        const schema: JSONSchema = {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          dependentSchemas: {
            name: {
              type: "object",
              properties: {
                age: { type: "number" },
              },
              required: ["age"],
            },
          },
        };
        const zodSchema = ObjectConverter.convert(schema);
        expect(zodSchema.safeParse({ name: "John" }).success).toBe(false);
        expect(zodSchema.safeParse({ name: "John", age: "30" }).success).toBe(
          false,
        );
      });
    });
  });
});
