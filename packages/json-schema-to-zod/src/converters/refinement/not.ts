import { convert } from "../../index";
import { RefinementHandler } from "../../types";

export const NotRefinementHandler: RefinementHandler = {
  refine(schema, zodSchema) {
    const { not } = schema;

    if (!not) {
      return zodSchema;
    }

    const notSchema = convert(not);
    return zodSchema.refine(
      (value: any) => {
        return !notSchema.safeParse(value).success;
      },
      { message: "Value must not match the 'not' schema" },
    );
  },
};
