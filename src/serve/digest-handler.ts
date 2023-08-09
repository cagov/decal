import glob from "glob";
import { DefaultContext } from "koa";
import { getEnvironment } from "../nunjucks.js";
import { Project } from "../project.js";

export const createDigestHandler = (project: Project) => {
  const { dirs, collections } = project;

  const templatesDir = `${dirs.templates}/serve`;
  const nunjucksEnv = getEnvironment(templatesDir);

  return async (ctx: DefaultContext) => {
    const _collections = collections.map((collection) => {
      const components = collection.components.map((component) => {
        const globbableDir = component.dir.replace("\\", "/");
        const files = glob
          .sync(`${globbableDir}/**/*.demo.html`)
          .map((filePath) => filePath.replace(`${globbableDir}/`, ""));

        return {
          def: component,
          files,
        };
      });

      return {
        def: collection,
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
