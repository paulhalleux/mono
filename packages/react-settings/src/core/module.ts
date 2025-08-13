import { EditorSettingsModule, ListSettingsModule } from "./types.ts";

export const Module = {
  makeList<EntityList, EntityIn = EntityList, EntityOut = EntityIn>(
    module: Omit<ListSettingsModule<EntityList, EntityIn, EntityOut>, "kind">,
  ): ListSettingsModule<EntityList, EntityIn, EntityOut> {
    return {
      kind: "list",
      ...module,
    };
  },
  makeEditor: <EntityList, EntityIn = EntityList, EntityOut = EntityIn>(
    module: Omit<EditorSettingsModule<EntityList, EntityIn, EntityOut>, "kind">,
  ): EditorSettingsModule<EntityList, EntityIn, EntityOut> => {
    return {
      kind: "editor",
      ...module,
    };
  },
};
