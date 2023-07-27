import Router from "@koa/router";
import chalk from "chalk";
import { promises as fs } from "fs";
import { createHtmlHandler } from "./html-handler.js";
import { createDigestHandler } from "./digest-handler.js";
import { Config } from "../config.js";
import { Format } from "../format.js";
import { FileReadError } from "../errors.js";

export const createRouter = (config: Config) => {
  const { dirs, collections } = config;

  const router = new Router();

  /* 
    Meta pages come first.
    These pages are generated by the tool to provide information.
  */

  // The digest file lists all example HTML files found by the tool.
  const digestHandler = createDigestHandler(config);
  router.get(["/", "/index.html"], digestHandler);

  /* 
    We'll then perform initial redirects up-front. 
  */

  const indexRoutes = collections.flatMap((collection) =>
    collection.components.map((component) => component.route)
  );

  // Redirect to corresponding index.html files.
  router.get(["/(.*)/", ...indexRoutes], (ctx) => {
    const index =
      ctx.path.slice(-1) === "/"
        ? `${ctx.path}index.html`
        : `${ctx.path}/index.html`;

    ctx.redirect(index);
  });

  /* 
    Next, we'll match URL routes to corresponding paths on the file system. 
    Each of these routes simply finds the filePath.
    Then the filePath is passed to the next Koa middleware for processing.
  */

  // Set up the router to load files from each component.
  collections.forEach((collection) => {
    collection.components.forEach((component) => {

      // For any component subfolders, like src, just serve the request.
      router.get(`${component.route}/(.*)`, async (ctx, next) => {
        if (!ctx.state.filePath) {
          ctx.state.filePath = `${dirs.target}${ctx.path}`;
        }

        await next();
      });
    });
  });

  // Handle all other non-special filePaths here.
  router.get("/(.*)", async (ctx, next) => {
    if (!ctx.state.filePath) {
      ctx.state.filePath = `${dirs.target}${ctx.path}`;
    }

    await next();
  });

  /*
    Forgive this brief intermission while we set up logging.
  */

  // Set up the router to perform the following actions against all requests.
  const loaderRoutes = collections
    .flatMap((collection) => collection.formats)
    .map((format) => `/(.*)${format.src.extname}`)
    .sort((a, b) => b.length - a.length);

  router.get(loaderRoutes, async (ctx, next) => {
    // Defer to next middleware.
    await next();

    // After all asset middlewares are complete below, log the request.
    console.log(`${chalk.blue("Format")}: ${ctx.state.fileLoader}`);
    console.log(`${chalk.blue("Request")}: ${ctx.path}`);
    const logPath = dirs.relative(ctx.state.filePath);
    if (ctx.status === 404) {
      console.log(`${chalk.bgRed("Not found")}: ${logPath}\n`);
    } else if (ctx.status === 500) {
      console.log(`${chalk.bgRed("Errors")}: ${logPath}\n`);
    } else {
      console.log(`${chalk.green("Served")}: ${logPath}\n`);
    }
  });

  /* 
    Now that we have a filePath, we can process assets below. 
  */

  // Handle templated HTML.
  const htmlHandler = createHtmlHandler(config);
  router.get("/(.*).html", htmlHandler);

  // Create a route for the given loader.
  const createLoaderRoute = (route: string, format: Format) => {
    const formatter = format.formatter;

    if (formatter) {
      router.get(route, async (ctx) => {
        if (!ctx.state.fileLoader) {
          await fs
            .readFile(ctx.state.filePath, "utf-8")
            .catch((err) => {
              throw new FileReadError(err.message, err.code, err.path);
            })
            .then((contents) => formatter(ctx.state.filePath, contents))
            .then((result) => {
              ctx.state.fileLoader = format.name;
              ctx.body = result;
              ctx.type = format.dist.mimeType;
            })
            .catch((err) => {
              ctx.state.fileLoader = format.name;
              if (err.name === "FileReadError") {
                ctx.body = "Not found";
                ctx.status = 404;
              } else {
                ctx.body = "Errors";
                ctx.status = 500;
              }
            });
        }
      });
    }
  };

  // Create collection-specific routes for each loader in each collection.
  collections.forEach((collection) => {
    collection.formats
      .sort((a, b) => b.src.extname.length - a.src.extname.length)
      .forEach((format) => {
        const route = `/${collection.name}/(.*)${format.src.extname}`;
        createLoaderRoute(route, format);
      });
  });

  // Create generic, fall-back routes for every loader, across all collections.
  collections
    .flatMap((collection) => collection.formats)
    .sort((a, b) => b.src.extname.length - a.src.extname.length)
    .forEach((format) => {
      const route = `/(.*)${format.src.extname}`;
      createLoaderRoute(route, format);
    });

  // Return the router for consumption by a Koa app.
  return router;
};
