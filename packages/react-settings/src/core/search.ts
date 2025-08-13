import { SearchFilterAPI, SearchFilterFunction } from "./types.ts";

export const Search = {
  api: (search: Omit<SearchFilterAPI, "kind">) => {
    return {
      kind: "api" as const,
      ...search,
    };
  },
  custom: <EntityIn>(search: Omit<SearchFilterFunction<EntityIn>, "kind">) => {
    return {
      kind: "custom" as const,
      ...search,
    };
  },
};
