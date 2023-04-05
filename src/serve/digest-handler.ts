import glob from "glob";
import { Config } from "../config.js";
import { DefaultContext } from "koa";
import { getEnvironment } from "../nunjucks.js";

export const createDigestHandler = (config: Config) => {
  const { dirs, collections, loaders } = config;

  const templatesDir = `${dirs.templates}/serve`;
  const nunjucksEnv = getEnvironment(templatesDir);

  return async (ctx: DefaultContext) => {
    const queryParams = Array.from(loaders).map(([id, loader]) => `no-${id}`);

    const _collections = collections.map((collection) => {
      const _components = collection.components.map((component) => {
        const files = glob
          .sync(`${component.dir}/examples/*.html`)
          .map((filePath) =>
            filePath.replace(`${component.dir}/examples/`, "")
          );

        return {
          ...component,
          files,
        };
      });

      return {
        ...collection,
        _components,
      };
    });

    // Render the HTML file into the template.
    const body = nunjucksEnv.render("digest.njk", {
      _collections,
      queryParams,
    });

    // Return the result.
    ctx.body = body;
  };
};
