import { PrimitiveHandler } from "../../types";

export const MinimumHandler: PrimitiveHandler = {
  apply(schema, context): void {
    const { minimum, exclusiveMinimum } = schema;
    if (context.isTypeDisabled("numeric") || minimum === undefined) {
      return;
    }

    context.enrich("numeric", (currentNumber) => {
      return currentNumber.min(exclusiveMinimum ? minimum + 1 : minimum);
    });
  },
};

export const MaximumHandler: PrimitiveHandler = {
  apply(schema, context): void {
    const { maximum, exclusiveMaximum } = schema;
    if (context.isTypeDisabled("numeric") || maximum === undefined) {
      return;
    }

    context.enrich("numeric", (currentNumber) => {
      return currentNumber.max(exclusiveMaximum ? maximum - 1 : maximum);
    });
  },
};

export const MultipleOfHandler: PrimitiveHandler = {
  apply(schema, context): void {
    const { multipleOf } = schema;
    if (context.isTypeDisabled("numeric") || multipleOf === undefined) {
      return;
    }

    context.enrich("numeric", (currentNumber) => {
      return currentNumber.refine(
        (value) => {
          if (multipleOf === 0) {
            return false;
          }

          // Handle very small divisors with precision tolerance
          const quotient = value / multipleOf;
          const rounded = Math.round(quotient);

          // Check if the quotient is close enough to an integer
          // Use a tolerance based on the smaller of the two numbers
          const tolerance = Math.min(
            Math.abs(value) * Number.EPSILON * 10,
            Math.abs(multipleOf) * Number.EPSILON * 10,
          );

          return (
            Math.abs(quotient - rounded) <= tolerance / Math.abs(multipleOf)
          );
        },
        { message: `Must be a multiple of ${multipleOf}` },
      );
    });
  },
};
