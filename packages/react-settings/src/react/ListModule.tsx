import { ListSettingsModule } from "../core";

type ListModuleProps<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> = {
  module: ListSettingsModule<EntityList, EntityIn, EntityOut>;
};

export function ListModule<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
>({ module }: ListModuleProps<EntityList, EntityIn, EntityOut>) {
  return <div></div>;
}
