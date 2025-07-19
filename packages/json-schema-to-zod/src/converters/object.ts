import { z } from "zod";

import { Converter } from "../types";

import { convertSchemaToZod } from "./schema";

export const OBJECT_TYPE = "object";
export const OBJECT_PROPERTIES = [
  "properties",
  "additionalProperties",
  "required",
  "dependentRequired",
  "dependentSchemas",
  "minProperties",
  "maxProperties",
  "propertyNames",
  "patternProperties",
];

export const ObjectConverter: Converter = {
  /**
   * Converts a JSON schema object to a Zod object schema.
   * @returns A Zod object schema.
   */
  convert: (schema) => {
    const {
      properties = {},
      additionalProperties = true,
      required = [],
      minProperties,
      maxProperties,
      propertyNames,
      dependentRequired,
      patternProperties,
      // dependentSchemas, // Not implemented
    } = schema;

    let zodSchema: z.ZodType;
    const zodObject = z.object(
      Object.entries(properties).reduce<
        Record<keyof typeof properties, z.ZodType>
      >((acc, [key, value]) => {
        if (typeof value === "boolean") {
          acc[key] = z.boolean();
        } else {
          const raw = convertSchemaToZod(value);
          acc[key] = required.includes(key) ? raw : raw.optional();
        }
        return acc;
      }, {}),
    );

    if (!additionalProperties) {
      zodSchema = z.strictObject(zodObject.shape);
    } else {
      const keySchema = (
        propertyNames ? convertSchemaToZod(propertyNames) : z.string()
      ) as z.ZodString;

      const valueSchema = convertSchemaToZod(additionalProperties);

      if (patternProperties) {
        const propertiesRecord = Object.entries(
          patternProperties,
        ).reduce<z.ZodType>((previousValue, [keyPattern, keySchema]) => {
          const record = z.record(
            z.string().regex(new RegExp(keyPattern)),
            convertSchemaToZod(keySchema),
          );

          if (!previousValue) {
            return record;
          }

          return previousValue.or(record);
        }, z.symbol("__no-match")); // Symbol to ensure it won't match

        zodSchema = zodObject.catchall(valueSchema).and(propertiesRecord);
      } else {
        zodSchema = zodObject
          .catchall(valueSchema)
          .and(z.record(keySchema, z.unknown()));
      }
    }

    if (minProperties !== undefined) {
      zodSchema = zodSchema.refine(
        (data) => {
          if (typeof data !== "object" || data === null) {
            return false;
          }
          return Object.keys(data).length >= minProperties;
        },
        {
          message: `Object must have at least ${minProperties} properties`,
        },
      );
    }

    if (maxProperties !== undefined) {
      zodSchema = zodSchema.refine(
        (data) => {
          if (typeof data !== "object" || data === null) {
            return false;
          }
          return Object.keys(data).length <= maxProperties;
        },
        {
          message: `Object must have at most ${maxProperties} properties`,
        },
      );
    }

    if (dependentRequired && typeof dependentRequired === "object") {
      for (const [key, dependencies] of Object.entries(dependentRequired)) {
        if (!Array.isArray(dependencies)) continue;

        zodSchema = zodSchema.refine(
          (obj) => {
            if (typeof obj !== "object" || obj === null) return false;

            // If the key is present
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              // Then all dependencies must also be present
              return dependencies.every((depKey) =>
                Object.prototype.hasOwnProperty.call(obj, depKey),
              );
            }

            // If key is not present, no dependency check needed
            return true;
          },
          {
            message: `If "${key}" is present, then ${dependencies
              .map((d) => `"${d}"`)
              .join(", ")} must also be present`,
          },
        );
      }
    }

    if (
      schema.dependentSchemas &&
      typeof schema.dependentSchemas === "object"
    ) {
      for (const [key, subSchema] of Object.entries(schema.dependentSchemas)) {
        const dependentZodSchema = convertSchemaToZod(subSchema);

        zodSchema = zodSchema.check((ctx) => {
          if (typeof ctx.value !== "object" || ctx.value === null) return;

          if (Object.prototype.hasOwnProperty.call(ctx.value, key)) {
            const result = dependentZodSchema.safeParse(ctx.value);
            if (!result.success) {
              for (const issue of result.error.issues) {
                ctx.issues.push(issue);
              }
            }
          }
        });
      }
    }

    return zodSchema;
  },

  /**
   * Checks if the provided schema is a boolean type.
   * @param schema - The JSON schema to check.
   * @returns True if the schema is a boolean type, otherwise false.
   */
  is: (schema) => {
    return (
      schema.type === OBJECT_TYPE ||
      (schema.type === undefined &&
        OBJECT_PROPERTIES.some((prop) => prop in schema))
    );
  },
};
