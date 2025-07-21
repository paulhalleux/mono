import isEqual from "lodash/isEqual";

import { RefinementHandler } from "../../types";

export const ConstRefinementHandler: RefinementHandler = {
  refine(schema, zodSchema) {
    const { const: _const } = schema as {
      const?: unknown;
    };

    if (
      _const === undefined ||
      _const === null ||
      (typeof _const !== "object" && !Array.isArray(_const))
    ) {
      return zodSchema;
    }

    return zodSchema.refine(
      (value) => {
        return isEqual(_const, value);
      },
      {
        message: `Value does not match the constant value`,
      },
    );
  },
};
