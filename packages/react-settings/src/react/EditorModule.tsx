import { EditorSettingsModule } from "../core";

type EditorModuleProps<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> = {
  module: EditorSettingsModule<EntityList, EntityIn, EntityOut>;
};

export function EditorModule<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
>({ module }: EditorModuleProps<EntityList, EntityIn, EntityOut>) {
  return <div></div>;
}
