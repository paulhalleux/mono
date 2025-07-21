import isEqual from "lodash/isEqual";

import { RefinementHandler } from "../../types";

export const EnumRefinementHandler: RefinementHandler = {
  refine(schema, zodSchema) {
    const { enum: _enum } = schema;
    if (!_enum || !Array.isArray(_enum) || _enum.length === 0) {
      return zodSchema;
    }

    const complexEnumItems = _enum.filter(
      (item) =>
        (typeof item === "object" && item !== null) || Array.isArray(item),
    );

    if (complexEnumItems.length === 0) {
      return zodSchema;
    }

    return zodSchema.refine(
      (value) => {
        return complexEnumItems.some((enumValue) => isEqual(enumValue, value));
      },
      {
        message: `Value does not match any of the enum values`,
      },
    );
  },
};
