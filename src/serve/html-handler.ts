import nunjucks, { Template } from "nunjucks";
import { promises as fs } from "fs";
import { Config } from "../config.js";
import { DefaultContext } from "koa";
import { getEnvironment } from "../nunjucks.js";

type RenderAttributes = {
  content?: Template;
  includeTags: string[];
};

export const createHtmlHandler = (config: Config) => {
  const { dirs, loaders, loaderTags, processors } = config;

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

    const includers: Promise<void>[] = [];

    loaders.forEach((loader, id) => {
      const processor = loader.processor;
      const loaderTag = loader.tag;

      if (processor && loaderTag) {
        loader.entryPoints.forEach((entryPoint) => {
          includers.push(
            fs
              .access(`${componentPath}/src/${entryPoint}`)
              .then(() => {
                const queryKey = `no-${id}`;
                const queryParam = query[queryKey];
                const enabled = !(queryParam === "" || queryParam === "true");
                if (enabled) {
                  const includeTag = loaderTag(entryPoint);
                  renderAttributes.includeTags.push(includeTag);
                }
              })
              .catch(() => void 0)
          );
        });
      }
    });

    await Promise.all(includers);

    // Render the HTML file into the template.
    const body = nunjucksEnv.render("layout.njk", renderAttributes);

    // Return the result.
    ctx.body = body;
  };
};
