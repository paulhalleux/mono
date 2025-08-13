import * as React from "react";

/**
 * Represents a middleware function for a settings module.
 *
 * This interface defines a middleware that can be used to intercept actions
 * before they are processed by the module, allowing for custom logic to be applied.
 */
export interface ModuleMiddleware<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> {
  /**
   * Middleware function that can be used to intercept actions
   * before they are processed by the module.
   * @param action The action being performed.
   * @param entity The entity being acted upon.
   * @param next The next function to call in the middleware chain.
   * @returns A promise that resolves to the modified entity or undefined.
   */
  (
    action: ActionKind,
    entity: EntityIn,
    next: (
      action: ActionKind,
      entity: EntityIn,
    ) => Promise<EntityOut | undefined>,
  ): Promise<EntityOut | undefined>;
}

/**
 * Represents the kind of action that can be performed in a settings module.
 *
 * This enum defines the different actions that can be performed,
 * such as creating, editing, or viewing an entity.
 */
export enum ActionKind {
  Create = "create",
  Edit = "edit",
  View = "view",
  Delete = "delete",
}

/**
 * Represents a data source for a list module.
 *
 * It defines the basic operations that can be performed on a list of entities,
 * such as fetching, saving, and deleting entities.
 */
export interface ListModuleDataSource<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> {
  /**
   * Fetches the list of entities.
   */
  fetch: () => Promise<EntityList[]>;
  /**
   * Fetches a single entity by its identifier.
   * @param id The identifier of the entity to fetch.
   */
  fetchById: (id: string) => Promise<EntityIn | null>;
  /**
   * Saves an entity.
   * @param entity The entity to save.
   * @param kind The kind of action being performed (create, edit, view).
   */
  save: (entity: EntityOut, kind: ActionKind) => Promise<void>;
  /**
   * Deletes an entity.
   * @param entity The entity to delete.
   */
  delete: (entity: EntityIn) => Promise<void>;
}

/**
 * Represents a data source for an editor module.
 *
 * It defines the basic operations that can be performed on a single entity,
 * such as fetching and saving the entity.
 */
export interface EditorModuleDataSource<EntityIn, EntityOut = EntityIn> {
  /**
   * Fetches a single entity by its identifier.
   * @param id The identifier of the entity to fetch.
   */
  fetch: () => Promise<EntityIn | undefined>;
  /**
   * Saves an entity.
   * @param entity The entity to save.
   */
  save: (entity: EntityOut, kind: ActionKind) => Promise<void>;
}

/**
 * Represents the base structure of a settings module.
 *
 * It defines the basic properties that every settings module should have.
 * This includes an identifier, a path, a kind, and a configuration.
 */
export interface BaseSettingsModule<
  Kind extends string,
  Config,
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> {
  /**
   * The unique identifier for the settings module.
   */
  id: string;
  /**
   * The path to the settings module.
   */
  path: string;
  /**
   * The list of middlewares that can be applied to the settings module.
   */
  middlewares?: ModuleMiddleware<EntityList, EntityIn, EntityOut>[];
  /**
   * The name of the settings module.
   */
  kind: Kind;
  /**
   * The list of entities that the settings module manages.
   */
  config: Config;
}

export type SearchFilterFunction<EntityIn> = {
  kind: "function";
  filter: (entity: EntityIn, searchTerm: string) => boolean;
  debounce?: number;
};

export type SearchFilterAPI = {
  kind: "api";
  param: string;
  debounce?: number;
};

export type SearchFilter<EntityIn> =
  | SearchFilterFunction<EntityIn>
  | SearchFilterAPI;

/**
 * Represents a settings module configuration for a list of entities
 * with an editor for each entity.
 */
export type ListModuleConfig<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> = {
  dataSource: ListModuleDataSource<EntityList, EntityIn, EntityOut>;
  editor: SettingsEditor<EntityList, EntityIn, EntityOut>;
  enabledActions?: ActionKind[];
  identifier: (entity: EntityList) => string;
  listTitle: string;
  editorTitle: string | ((entity: EntityIn, action: ActionKind) => string);
  searchPlaceholder?: string;
  searchFilter?: SearchFilter<EntityIn>;
};

/**
 * Represents a settings module configuration for a single editor.
 */
export type EditorModuleConfig<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> = {
  dataSource: EditorModuleDataSource<EntityIn, EntityOut>;
  editor: SettingsEditor<EntityList, EntityIn, EntityOut>;
  editorTitle: string | ((entity: EntityIn, action: ActionKind) => string);
};

/**
 * Represents a settings module for a list of entities.
 *
 * It defines everything that a list settings module should have and
 * how it should behave.
 */
export type ListSettingsModule<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> = BaseSettingsModule<
  "list",
  ListModuleConfig<EntityList, EntityIn, EntityOut>,
  EntityList,
  EntityIn,
  EntityOut
>;

/**
 * Represents a settings module for a single editor.
 *
 * It defines everything that an editor settings module should have and
 * how it should behave.
 */
export type EditorSettingsModule<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> = BaseSettingsModule<
  "editor",
  EditorModuleConfig<EntityList, EntityIn, EntityOut>,
  EntityList,
  EntityIn,
  EntityOut
>;

/**
 * Represents a settings module.
 *
 * It defines everything that a settings module should have and
 * how it should behave.
 */
export type SettingsModule<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> =
  | ListSettingsModule<EntityList, EntityIn, EntityOut>
  | EditorSettingsModule<EntityList, EntityIn, EntityOut>;

/**
 * Represents a settings editor.
 *
 * It defines the basic structure of a settings editor definition.
 */
export interface BaseEditor<Kind extends string, Config> {
  kind: Kind;
  config: Config;
}

/**
 * Represents the properties for a component editor.
 *
 * This interface defines the properties that a component editor should have,
 * including the module it is associated with, the entity being edited (if any),
 * the kind of action being performed, and callbacks for saving and canceling.
 */
export interface ComponentEditorProps<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> {
  module: SettingsModule<EntityList, EntityIn, EntityOut>;
  entity?: EntityIn;
  kind: ActionKind;
  onSave: (entity: EntityOut) => void;
  onCancel: () => void;
}

export type NoneSettingsEditor = BaseEditor<"none", {}>;

export type ComponentSettingsEditor<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> = BaseEditor<
  "component",
  {
    component: React.ComponentType<
      ComponentEditorProps<EntityList, EntityIn, EntityOut>
    >;
  }
>;

export type SettingsEditor<
  EntityList,
  EntityIn = EntityList,
  EntityOut = EntityIn,
> =
  | ComponentSettingsEditor<EntityList, EntityIn, EntityOut>
  | NoneSettingsEditor;
