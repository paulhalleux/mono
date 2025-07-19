import { describe, expect, test } from "bun:test";
import { JSONSchema } from "zod/v4/core/json-schema";

import { convert } from "../../src";

export const runSuite = async (
  suites: Array<{
    description: string;
    schema: object;
    tests: Array<{
      description: string;
      data: any;
      valid: boolean;
    }>;
  }>,
) => {
  for (const suite of suites) {
    describe(suite.description, () => {
      const zodSchema = convert(suite.schema as JSONSchema);

      for (const testItem of suite.tests) {
        test(testItem.description, () => {
          const result = zodSchema.safeParse(testItem.data);
          expect(result.success).toBe(testItem.valid);
          expect(result.data).toEqual(
            testItem.valid ? testItem.data : undefined,
          );
        });
      }
    });
  }
};
