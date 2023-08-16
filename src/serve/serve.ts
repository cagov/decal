import Koa from "koa";
import serveStatic from "koa-static";
import koaMount from "koa-mount";
import websockify from "koa-websocket";
import chalk from "chalk";
import { createRouter } from "./router.js";
import { createWatcher } from "./watcher.js";
import { Project } from "../project.js";

export const serve = (project: Project, port: number) => {
  const { dirs } = project;

  // Initialize a websockets-enabled Koa app.
  const app = websockify(new Koa());

  // Initialize the websockets watcher. Add it to the Koa app.
  const watcher = createWatcher(project);
  app.ws.use(watcher);

  const root = project.dir || "./";
  app.use(koaMount("/", serveStatic(root, { defer: true })));

  const scriptsDir = `${dirs.templates}/scripts`;
  app.use(koaMount("/_scripts", serveStatic(scriptsDir)));

  // Create the router for our components.
  const router = createRouter(project);

  // Start up the app!
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.listen(port);

  const serveUrl = `http://localhost:${port}`;
  const servePath = dirs.relative(dirs.target);

  console.log("Entering serve mode");
  console.log(`Serving from ${servePath}\n`);

  console.log(`Dev server started at ${chalk.underline(serveUrl)}\n`);
};
