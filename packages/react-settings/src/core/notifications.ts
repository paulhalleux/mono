import { ModuleMiddleware } from "./types.ts";

export type Notification = {
  type: "success" | "error";
  title: string;
  message: string;
  timestamp: Date;
};

export type NotificationsConfig = {
  entityName?: string;
  send(notification: Notification): void;
};

export const Notifications = {
  make: <EntityList, EntityIn = EntityList, EntityOut = EntityIn>({
    entityName,
    send,
  }: NotificationsConfig): ModuleMiddleware<
    EntityList,
    EntityIn,
    EntityOut
  > => {
    return async (action, entity, next) => {
      try {
        const res = await next(action, entity);
        if (action !== "view") {
          send({
            type: "success",
            title: `Success!`,
            message: `Successfully ${action} ${entityName ?? "entity"}`,
            timestamp: new Date(),
          });
        }
        return res;
      } catch (error) {
        if (error instanceof Error) {
          send({
            type: "error",
            title: `Error!`,
            message: error.message,
            timestamp: new Date(),
          });
        } else {
          send({
            type: "error",
            title: `Error!`,
            message: `Failed to ${action} ${entityName}`,
            timestamp: new Date(),
          });
        }
      }
    };
  },
};

export const consoleNotificationSender = (notification: Notification): void => {
  console.log(
    `${notification.type.toUpperCase()}: ${notification.title} - ${notification.message} at ${notification.timestamp}`,
  );
};
