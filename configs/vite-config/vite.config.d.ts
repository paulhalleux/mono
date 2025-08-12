import { UserConfig } from "vite";

declare module "vite.app.config" {
  const config: UserConfig;
  export default config;
}

declare module "vite.lib.config" {
  const config: UserConfig;
  export default config;
}
