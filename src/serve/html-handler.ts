import nunjucks, { Template, render } from "nunjucks";
import { promises as fs } from "fs";
import { Config } from "../config.js";
import { DefaultContext } from "koa";
import { getEnvironment } from "../nunjucks.js";

type RenderAttributes = {
  content?: Template;
  entryPoints: { name: string; enabled: boolean }[];
  includeTags: string[];
};

export const createHtmlHandler = (config: Config) => {
  const { dirs, collections } = config;

  const templatesDir = `${dirs.templates}/serve`;
  const nunjucksEnv = getEnvironment(templatesDir);

  return async (ctx: DefaultContext) => {
    const {
      state: { filePath },
      query,
    } = ctx;

    console.log(query);

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

    const componentPathIndex = filePath.indexOf("/demo");
    const componentPath = filePath.substring(0, componentPathIndex);

    const collection = collections.find((collection) => {
      return ctx.path.startsWith(`/${collection.dirName}`);
    });

    const includers: Promise<void>[] = [];

    if (collection) {
      collection.includeTags.forEach((includeTag) => {
        includers.push(
          new Promise((resolve) => {
            const tag = includeTag("");
            renderAttributes.includeTags.push(tag);
            resolve(void 0);
          })
        );
      });

      collection.formats.forEach((format) => {
        const includeTag = format.includeTag;

        format.entryPoints.forEach((entryPoint) => {
          includers.push(
            fs
              .access(`${componentPath}/src/${entryPoint}`)
              .then(() => {
                const queryParam = query[entryPoint];
                const reload = query["reload"] === "true";
                const enabled = !reload || (reload && queryParam === "on");

                const tag = enabled ? includeTag(entryPoint) : "";

                renderAttributes.entryPoints.push({
                  name: entryPoint,
                  enabled: tag ? true : false,
                });

                if (tag) {
                  renderAttributes.includeTags.push(tag);
                }
              })
              .catch(() => void 0)
          );
        });
      });
    }

    await Promise.all(includers);

    // Render the HTML file into the template.
    const body = nunjucksEnv.render("layout.njk", renderAttributes);

    // Return the result.
    ctx.body = body;
  };
};
