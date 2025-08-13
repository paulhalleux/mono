import { ComponentSettingsEditor } from "./types.ts";

export const Editor = {
  makeComponent<EntityList, EntityIn = EntityList, EntityOut = EntityIn>(
    config: ComponentSettingsEditor<EntityList, EntityIn, EntityOut>["config"],
  ) {
    return {
      kind: "component",
      config,
    } as const;
  },
  none() {
    return {
      kind: "none",
      config: {},
    } as const;
  },
};
