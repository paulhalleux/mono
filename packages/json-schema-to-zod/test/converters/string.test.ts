import { describe, expect, test } from "bun:test";
import { JSONSchema } from "zod/v4/core/json-schema";

import { StringConverter } from "../../src/converters/string";

describe("converters/string", () => {
  describe("is", () => {
    test("should return true for string type schema", () => {
      const jsonSchema: JSONSchema = {
        type: "string",
      };

      expect(StringConverter.is(jsonSchema)).toBe(true);
    });

    test("should return true for schema with string properties", () => {
      const jsonSchema: JSONSchema = {
        minLength: 5,
        maxLength: 10,
        pattern: "^[a-z]+$",
        format: "email",
      };

      expect(StringConverter.is(jsonSchema)).toBe(true);
    });

    test("should return false for non-string schema", () => {
      const jsonSchema: JSONSchema = {
        type: "number",
      };

      expect(StringConverter.is(jsonSchema)).toBe(false);
    });
  });

  describe("validation", () => {
    test("should validate a string with minLength and maxLength", () => {
      const jsonSchema: JSONSchema = {
        type: "string",
        minLength: 3,
        maxLength: 5,
      };

      const zodSchema = StringConverter.convert(jsonSchema);

      expect(zodSchema.safeParse("abc").success).toBe(true);
      expect(zodSchema.safeParse("ab").success).toBe(false);
      expect(zodSchema.safeParse("abcdef").success).toBe(false);
    });

    test("should validate a string with regex pattern", () => {
      const jsonSchema: JSONSchema = {
        type: "string",
        pattern: "^[a-z]+$",
      };

      const zodSchema = StringConverter.convert(jsonSchema);

      expect(zodSchema.safeParse("abc").success).toBe(true);
      expect(zodSchema.safeParse("ABC").success).toBe(false);
    });

    test("should validate a string with format and validation properties", () => {
      const jsonSchema: JSONSchema = {
        type: "string",
        format: "email",
        minLength: 15,
      };

      const zodSchema = StringConverter.convert(jsonSchema);

      expect(zodSchema.safeParse("abc@def.ghi").success).toBe(false);
      expect(zodSchema.safeParse("abc@definitive.ghi").success).toBe(true);
    });

    test("should not care about format if not supported", () => {
      const jsonSchema: JSONSchema = {
        type: "string",
        format: "unsupported-format",
      };

      const zodSchema = StringConverter.convert(jsonSchema);

      expect(zodSchema.safeParse("test").success).toBe(true);
      expect(zodSchema.safeParse(123).success).toBe(false);
      expect(zodSchema.safeParse(null).success).toBe(false);
    });
  });

  describe("formats", () => {
    describe("email", () => {
      test("should validate 'email' format", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "email",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("my-email@gemail.com").success).toBe(true);
      });

      test("should not validate invalid 'email' format", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "email",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("invalid-email").success).toBe(false);
      });
    });

    describe("date", () => {
      test("should validate 'date' format", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "date",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("2023-10-01").success).toBe(true);
      });

      test("should not validate invalid 'date' format", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "date",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("2023-13-01").success).toBe(false);
      });

      test("should validate 'date' format with min", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "date",
          formatMinimum: "2023-01-01",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("2023-06-15").success).toBe(true);
        expect(zodSchema.safeParse("2022-12-31").success).toBe(false);
      });

      test("should validate 'date' format with max", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "date",
          formatMaximum: "2023-12-31",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("2023-11-30").success).toBe(true);
        expect(zodSchema.safeParse("2024-01-01").success).toBe(false);
      });

      test("should validate 'date' format with min and max", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "date",
          formatMinimum: "2023-01-01",
          formatMaximum: "2023-12-31",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("2023-06-15").success).toBe(true);
        expect(zodSchema.safeParse("2022-12-31").success).toBe(false);
        expect(zodSchema.safeParse("2024-01-01").success).toBe(false);
      });
    });

    describe("time", () => {
      test("should validate 'time' format", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "time",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("12:34:56").success).toBe(true);
      });

      test("should not validate invalid 'time' format", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "time",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("12:60:00").success).toBe(false);
      });

      test("should validate 'time' format with min", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "time",
          formatMinimum: "12:00:00",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("13:30:00").success).toBe(true);
        expect(zodSchema.safeParse("11:59:59").success).toBe(false);
      });

      test("should validate 'time' format with max", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "time",
          formatMaximum: "14:00:00",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("13:30:00").success).toBe(true);
        expect(zodSchema.safeParse("14:01:00").success).toBe(false);
      });

      test("should validate 'time' format with min and max", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "time",
          formatMinimum: "12:00:00",
          formatMaximum: "14:00:00",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("13:30:00").success).toBe(true);
        expect(zodSchema.safeParse("11:59:59").success).toBe(false);
        expect(zodSchema.safeParse("14:01:00").success).toBe(false);
      });

      test("should validate 'time' format with exclusive min and max", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "time",
          formatExclusiveMinimum: "12:00:00",
          formatExclusiveMaximum: "14:00:00",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("13:30:00").success).toBe(true);
        expect(zodSchema.safeParse("12:00:00").success).toBe(false);
        expect(zodSchema.safeParse("14:00:00").success).toBe(false);
      });
    });

    describe("date-time", () => {
      test("should validate 'date-time' format", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "date-time",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("2023-10-01T12:34:56Z").success).toBe(true);
      });

      test("should not validate invalid 'date-time' format", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "date-time",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("2023-10-01T25:00:00Z").success).toBe(false);
      });

      test("should validate 'date-time' format with min", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "date-time",
          formatMinimum: "2023-01-01T00:00:00Z",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("2023-06-15T12:34:56Z").success).toBe(true);
        expect(zodSchema.safeParse("2022-12-31T23:59:59Z").success).toBe(false);
      });

      test("should validate 'date-time' format with max", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "date-time",
          formatMaximum: "2023-12-31T23:59:59Z",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("2023-11-30T12:34:56Z").success).toBe(true);
        expect(zodSchema.safeParse("2024-01-01T00:00:00Z").success).toBe(false);
      });

      test("should validate 'date-time' format with min and max", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "date-time",
          formatMinimum: "2023-01-01T00:00:00Z",
          formatMaximum: "2023-12-31T23:59:59Z",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("2023-06-15T12:34:56Z").success).toBe(true);
        expect(zodSchema.safeParse("2022-12-31T23:59:59Z").success).toBe(false);
        expect(zodSchema.safeParse("2024-01-01T00:00:00Z").success).toBe(false);
      });

      test("should validate 'date-time' format with exclusive min and max", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "date-time",
          formatExclusiveMinimum: "2023-01-01T00:00:00Z",
          formatExclusiveMaximum: "2023-12-31T23:59:59Z",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("2023-06-15T12:34:56Z").success).toBe(true);
        expect(zodSchema.safeParse("2022-12-31T23:59:59Z").success).toBe(false);
        expect(zodSchema.safeParse("2024-01-01T00:00:00Z").success).toBe(false);
      });
    });

    describe("uuid", () => {
      test("should validate 'uuid' format", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "uuid",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(
          zodSchema.safeParse("16e422e6-07aa-483e-953c-38350e364f70").success,
        ).toBe(true);
      });

      test('should not validate "uuid" format with wrong version (v7)', () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "uuid",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(
          zodSchema.safeParse("01982332-2c6c-713c-b31b-739bb364453f").success,
        ).toBe(false);
      });

      test("should not validate invalid 'uuid' format", () => {
        const jsonSchema: JSONSchema = {
          type: "string",
          format: "uuid",
        };

        const zodSchema = StringConverter.convert(jsonSchema);

        expect(zodSchema.safeParse("invalid-uuid").success).toBe(false);
      });
    });
  });
});
