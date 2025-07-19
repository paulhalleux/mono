import { describe, expect, test } from "bun:test";
import { JSONSchema } from "zod/v4/core/json-schema";

import { ConstConverter } from "../../src/converters/const";

describe("converters/const", () => {
  describe("is", () => {
    test("should return true for schema with const", () => {
      const schema: JSONSchema = { const: "value" };
      expect(ConstConverter.is(schema)).toBe(true);
    });

    test("should return false for schema without const", () => {
      const schema: JSONSchema = { type: "string" };
      expect(ConstConverter.is(schema)).toBe(false);
    });
  });

  describe("validation", () => {
    [
      { schema: { const: "value" }, value: "value" },
      { schema: { const: 42 }, value: 42 },
      { schema: { const: true }, value: true },
      { schema: { const: null }, value: null },
      { schema: { const: 3.14 }, value: 3.14 },
    ].forEach(({ schema, value }) => {
      test(`should validate const value ${JSON.stringify(schema.const)} to Zod literal`, () => {
        const zodSchema = ConstConverter.convert(schema);
        expect(zodSchema.safeParse(value).success).toBe(true);
      });
    });
  });
});
