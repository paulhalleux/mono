import { z } from "zod";

import { convert } from "../../index";
import { PrimitiveHandler } from "../../types";

const OBJECT_VALIDATION_KEYWORDS = ["maxProperties", "minProperties"];

// Implicitly infer an object type from schema if a validation keyword applicable to the full object is present
// and "object" type is not explicitly defined
export const ImplicitObjectHandler: PrimitiveHandler = {
  apply(schema, context): void {
    if (
      schema.type !== undefined ||
      context.types.object !== undefined ||
      context.isTypeDisabled("object")
    ) {
      return;
    }

    if (
      !OBJECT_VALIDATION_KEYWORDS.some(
        (keyword) => schema[keyword] !== undefined,
      )
    ) {
      return;
    }

    context.set("object", z.object().catchall(z.unknown()));
  },
};

export const MinPropertiesHandler: PrimitiveHandler = {
  apply(schema, context): void {
    const { minProperties } = schema;
    if (context.isTypeDisabled("object") || minProperties === undefined) return;

    context.enrich("object", (currentObject) => {
      return currentObject.refine(
        (value) => {
          if (typeof value !== "object" || value === null) {
            return false;
          }
          return Object.keys(value).length >= minProperties;
        },
        {
          message: `Object must have at least ${minProperties} properties`,
        },
      );
    });
  },
};

export const MaxPropertiesHandler: PrimitiveHandler = {
  apply(schema, context): void {
    const { maxProperties } = schema;
    if (context.isTypeDisabled("object") || maxProperties === undefined) return;

    context.enrich("object", (currentObject) => {
      return currentObject.refine(
        (value) => {
          if (typeof value !== "object" || value === null) {
            return false;
          }
          return Object.keys(value).length <= maxProperties;
        },
        {
          message: `Object must have at most ${maxProperties} properties`,
        },
      );
    });
  },
};

export const RequiredPropertiesHandler: PrimitiveHandler = {
  apply(schema, context): void {
    const { required } = schema;
    if (context.isTypeDisabled("object") || !Array.isArray(required)) return;

    context.enrich("object", (currentObject) => {
      return currentObject.refine(
        (value) => {
          if (typeof value !== "object" || value === null) {
            return false;
          }

          return required.every((key) => {
            return Object.getOwnPropertyDescriptor(value, key) !== undefined;
          });
        },
        {
          message: `Object must have required properties: ${required.join(", ")}`,
        },
      );
    });
  },
};

export const PropertyNamesHandler: PrimitiveHandler = {
  apply(schema, context): void {
    const { propertyNames } = schema;
    if (context.isTypeDisabled("object") || propertyNames === undefined) return;

    const propertyNamesSchema =
      propertyNames === false ? z.never() : convert(propertyNames);

    context.enrich("object", (currentObject) => {
      return currentObject.refine(
        (value) => {
          if (typeof value !== "object" || value === null) {
            return false;
          }

          const keys = Object.keys(value);
          for (const key of keys) {
            const result = propertyNamesSchema.safeParse(key);
            if (!result.success) {
              return false;
            }
          }
          return true;
        },
        {
          message: "Object properties do not match the required pattern",
        },
      );
    });
  },
};

export const PropertiesHandler: PrimitiveHandler = {
  apply(schema, context): void {
    const { properties } = schema;
    if (context.isTypeDisabled("object") || !properties) return;

    context.enrich("object", (currentObject) => {
      return currentObject.refine(
        (value) => {
          if (typeof value !== "object" || value === null) {
            return false;
          }

          for (const [key, propSchema] of Object.entries(properties)) {
            if (
              propSchema === undefined ||
              !Object.getOwnPropertyDescriptor(value, key)
            ) {
              return false;
            }

            const propValue = value[key];
            const propZodSchema = convert(propSchema);
            const result = propZodSchema.safeParse(propValue);
            if (!result.success) {
              return false;
            }
          }
          return true;
        },
        {
          message: "Object properties do not match the defined schemas",
        },
      );
    });
  },
};
