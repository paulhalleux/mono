import {
  consoleNotificationSender,
  Editor,
  ListModuleDataSource,
  Module,
  Notifications,
  Search,
} from "./core";

export * from "./core";

type User = {
  id: string;
  name: string;
  email: string;
};

const dataSource: ListModuleDataSource<User> = {
  fetch: async () => {
    return [
      { id: "1", name: "Alice", email: "email" },
      { id: "2", name: "Bob", email: "email" },
      { id: "3", name: "Charlie", email: "email" },
    ];
  },
  fetchById: async () => null,
  save: async () => {},
  delete: async () => {},
};

const list = Module.makeList<User>({
  id: "list",
  path: "list",
  middlewares: [
    Notifications.make({
      entityName: "user",
      send: consoleNotificationSender,
    }),
  ],
  config: {
    dataSource,
    identifier: (entity) => entity.id,
    editor: Editor.makeComponent({
      component: () => null,
    }),
    listTitle: "Users",
    editorTitle: (entity, action) => {
      return action === "create" ? "Create User" : `Edit User: ${entity.name}`;
    },
    searchFilter: Search.api({
      param: "search",
    }),
  },
});
