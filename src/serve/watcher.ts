import chokidar from "chokidar";
import chalk from "chalk";
import events from "events";
import { DefaultContext } from "koa";
import { Config } from "../config";

/**
 * This is the watcher. It watches the component's files for changes.
 *
 * When a change is detected (by chokidar), the server sends a signal to
 * the browser to reload the page. This signal is sent via Websockets.
 *
 * The export is a Koa router, which should be installed in the Koa app.
 */
export const createWatcher = (config: Config) => {
  const {
    dirs: { target },
  } = config;

  const eventEmitter = new events.EventEmitter();

  // Watches for file changes.
  const watcher = chokidar.watch(target, {
    ignored: "**/node_modules/**",
    ignoreInitial: true,
  });

  // Emits file change events.
  const notifyFile = (verb: string, filePath: string) => {
    console.log(`${chalk.magenta(`File ${verb}`)}: ${filePath}`);
    console.log(`${chalk.bgGreen("** Reloading browser **")}\n`);
    eventEmitter.emit("file_changed");
  };

  // Performs the following actions on file changes.
  watcher
    .on("add", (filePath) => notifyFile("added", filePath))
    .on("change", (filePath) => notifyFile("changed", filePath))
    .on("unlink", (filePath) => notifyFile("removed", filePath));

  // Websockets handler.
  const socketHandler = async (ctx: DefaultContext) => {
    ctx.websocket.send("connected");

    // Tell the browser to reload whenever a file changes.
    eventEmitter.once("file_changed", () => {
      ctx.websocket.send("reload");
    });
  };

  return socketHandler;
};
