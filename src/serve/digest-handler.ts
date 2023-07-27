import glob from "glob";
import { Config } from "../config.js";
import { DefaultContext } from "koa";
import { getEnvironment } from "../nunjucks.js";

export const createDigestHandler = (config: Config) => {
  const { dirs, collections } = config;

  const templatesDir = `${dirs.templates}/serve`;
  const nunjucksEnv = getEnvironment(templatesDir);

  return async (ctx: DefaultContext) => {
    const _collections = collections.map((collection) => {
      const components = collection.components.map((component) => {
        const files = glob
          .sync(`${component.dir}/**/*.demo.html`)
          .map((filePath) => filePath.replace(`${component.dir}/`, ""));

        return {
          ...component,
          files,
        };
      });

      return {
        ...collection,
        components,
      };
    });

    // Render the HTML file into the template.
    const body = nunjucksEnv.render("digest.njk", {
      collections: _collections,
    });

    // Return the result.
    ctx.body = body;
  };
};
