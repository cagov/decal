import nunjucks, { Template, render } from "nunjucks";
import * as path from "path";
import { promises as fs } from "fs";
import { DefaultContext } from "koa";
import { getEnvironment } from "../nunjucks.js";
import { Project } from "../project.js";

type RenderAttributes = {
  content?: Template;
  entryPoints: { name: string; id: string; enabled: boolean }[];
  includeTags: string[];
};

export const createHtmlHandler = (project: Project) => {
  const { dirs, collections } = project;

  const templatesDir = `${dirs.templates}/serve`;
  const nunjucksEnv = getEnvironment(templatesDir);

  return async (ctx: DefaultContext) => {
    const {
      state: { filePath },
      query,
    } = ctx;

    // If the path ends with .raw.html, pass. Don't template it.
    if (ctx.path.endsWith(".raw.html")) {
      return;
    }

    const renderAttributes: RenderAttributes = {
      includeTags: [],
      entryPoints: [],
    };

    // Load the given HTML file.
    await fs
      .readFile(filePath, "utf-8")
      .catch(() => {
        // If file not found, we'll supply our own "not found" HTML.
        ctx.status = 404;
        return `<p>File not found: ${filePath}</p>`;
      })
      .then((str) => {
        // Prepare the HTML for nunjucks.
        renderAttributes.content = nunjucks.compile(str);
      });

    const collection = collections.find((collection) => {
      return ctx.path.startsWith(`/${collection.dirName}`);
    });

    const includers: Promise<void>[] = [];

    if (collection) {
      const componentPathRegex = RegExp(
        `(.+\/${collection.dirName}\/[^/]+)\/.+$`,
        "i"
      );
      const componentPath = filePath.match(componentPathRegex)[1];
      const componentName = path.basename(componentPath);

      collection.componentDef.formats.forEach((format) => {
        const include = format.include;
        const entryPoint = format.entryPoint(componentName);

        if (include.id !== "empty") {
          includers.push(
            fs
              .access(`${componentPath}/${entryPoint}`)
              .then(() => {
                const queryId = `${include.id}-${entryPoint}`;
                const queryParam = query[queryId];
                const reload = query["reload"] === "true";
                const enabled = !reload || (reload && queryParam === "on");

                const tag = enabled ? include.tag(entryPoint) : "";

                renderAttributes.entryPoints.push({
                  name: `${format.name} (${entryPoint})`,
                  id: queryId,
                  enabled: tag ? true : false,
                });

                if (tag) {
                  renderAttributes.includeTags.push(tag);
                }
              })
              .catch(() => {
                return void 0;
              })
          );
        }
      });

      collection.includes.forEach((include) => {
        includers.push(
          new Promise((resolve) => {
            const queryParam = query[include.id];
            const reload = query["reload"] === "true";
            const enabled = !reload || (reload && queryParam === "on");

            const tag = enabled ? include.tag("") : "";

            renderAttributes.entryPoints.push({
              name: `${include.name}`,
              id: include.id,
              enabled: tag ? true : false,
            });

            if (tag) {
              renderAttributes.includeTags.push(tag);
            }

            resolve(void 0);
          })
        );
      });
    }

    await Promise.all(includers);

    // Render the HTML file into the template.
    const body = nunjucksEnv.render("plain.njk", renderAttributes);

    // Return the result.
    ctx.body = body;
  };
};
