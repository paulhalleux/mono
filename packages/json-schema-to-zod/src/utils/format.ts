import { JSONSchema } from "zod/v4/core/json-schema";

/**
 * Generates an error message for time format validation based on the provided schema properties.
 * @param type - The type of time format (e.g., "time", "date-time").
 * @param formatMinimum - The minimum allowed value for the time format.
 * @param formatMaximum - The maximum allowed value for the time format.
 * @param formatExclusiveMinimum - The exclusive minimum allowed value for the time format.
 * @param formatExclusiveMaximum
 */
export function getTimeFormatErrorMessage(
  type: string,
  {
    formatMinimum,
    formatMaximum,
    formatExclusiveMinimum,
    formatExclusiveMaximum,
  }: JSONSchema,
): string {
  const capitalType =
    type.replace(/-/g, " & ").charAt(0).toUpperCase() + type.slice(1);
  if (formatExclusiveMinimum && formatExclusiveMaximum) {
    return `${capitalType} must be between ${formatExclusiveMinimum} and ${formatExclusiveMaximum}, exclusive.`;
  }
  if (formatMinimum && formatMaximum) {
    return `${capitalType} must be between ${formatMinimum} and ${formatMaximum}.`;
  }
  if (formatExclusiveMinimum) {
    return `${capitalType} must be after ${formatExclusiveMinimum}, exclusive.`;
  }
  if (formatExclusiveMaximum) {
    return `${capitalType} must be before ${formatExclusiveMaximum}, exclusive.`;
  }
  if (formatMinimum) {
    return `${capitalType} must be on or after ${formatMinimum}.`;
  }
  if (formatMaximum) {
    return `${capitalType} must be on or before ${formatMaximum}.`;
  }
  return `Invalid ${type} format.`;
}
