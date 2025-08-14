import { SettingsModuleType } from "../core";

import { EditorModule } from "./EditorModule.tsx";
import { ListModule } from "./ListModule.tsx";

export type ModuleProps<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> = {
  module: SettingsModuleType<EntityList, EntityIn, EntityOut>;
};

export function Module<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
>({ module }: ModuleProps<EntityList, EntityIn, EntityOut>) {
  switch (module.kind) {
    case "list":
      return <ListModule module={module} />;
    case "editor":
      return <EditorModule module={module} />;
    default:
      return <div>Unknown Module Type</div>;
  }
}
