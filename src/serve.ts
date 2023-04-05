import Koa from "koa";
import serveStatic from "koa-static";
import koaMount from "koa-mount";
import websockify from "koa-websocket";
import chalk from "chalk";
import { createRouter } from "./serve/router.js";
import { createWatcher } from "./serve/watcher.js";
import { Config } from "./config.js";

export const serve = (config: Config) => {
  const { port, dirs, collections } = config;

  // Initialize a websockets-enabled Koa app.
  const app = websockify(new Koa());

  // Initialize the websockets watcher. Add it to the Koa app.
  const watcher = createWatcher(config);
  app.ws.use(watcher);

  // This is where Base CSS expects to find fonts.
  // Can't be helped here, it's hard-coded in the Design System.
  const fontsDir = `${dirs.templates}/fonts`;
  app.use(koaMount("/fonts", serveStatic(fontsDir)));

  collections.forEach((collection) => {
    collection.components.forEach((component) => {
      app.use(
        koaMount(
          component.route,
          serveStatic(`${component.dir}/examples`, { defer: true })
        )
      );
    });
  });

  // Create the router for our components.
  const router = createRouter(config);

  // Start up the app!
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.listen(port);

  const serveUrl = `http://localhost:${port}`;
  const servePath = dirs.relative(dirs.target);

  console.log("Entering serve mode");
  console.log(`Serving from ${servePath}\n`);

  console.log(`Dev server started at ${chalk.underline(serveUrl)}`);
};
