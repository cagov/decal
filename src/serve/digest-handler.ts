import glob from "glob";
import { DefaultContext } from "koa";
import { Project } from "../project.js";
import { ProjectComponent } from "../component.js";
import { ProjectCollection } from "../collection.js";

type ComponentDef = {
  def: ProjectComponent;
  files: string[];
};

type CollectionDef = {
  def: ProjectCollection;
  components: ComponentDef[];
};

const componentHtml = (component: ComponentDef) => {
  const files = component.files.map(
    (file) => /* html */ `
      <p>
        <a href="${component.def.route}/${file}">${file}</a>
      </p>
    `
  );

  return /* html */ `
    <div class="component">
      <h3>${component.def.dirName}</h3>
      ${files}
    </div>
  `;
};

const componentsHtml = (components: ComponentDef[]) => {
  return components.map((component) => componentHtml(component)).join("\n");
};

const sectionHtml = (heading: string, content: string) => {
  return /* html */ `
    <h2>${heading}</h2>
    ${content}
  `;
};

const collectionHtml = (collection: CollectionDef) => {
  const components = collection.components;
  return sectionHtml(collection.def.name, componentsHtml(components));
};

const rootComponentHtml = (component: ComponentDef) => {
  return sectionHtml(component.def.name, componentHtml(component));
};

const digestHtml = (
  collections: CollectionDef[],
  rootComponents: ComponentDef[]
) => {
  return /* html */ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgo=">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Components Digest</title>
        <style>
          h2 {
            background: darkslategrey;
            color: white;
            padding: 1rem;
          }
          div.component {
            margin: 0 2rem;
          }
        </style>
      </head>
      <body>
        <main style="margin: 2rem;">
          <h1>The Digest</h1>
          ${collections
            .map((collection) => collectionHtml(collection))
            .join("\n")}
          ${rootComponents
            .map((component) => rootComponentHtml(component))
            .join("\n")}
        </main>
      </body>
    </html>
  `;
};

const getComponentFiles = (component: ProjectComponent) => {
  const globbableDir = component.dir.replace("\\", "/");
  const files = glob
    .sync(`${globbableDir}/**/*.demo.html`)
    .map((filePath) => filePath.replace(`${globbableDir}/`, ""));

  return {
    def: component,
    files,
  };
};

export const createDigestHandler = (project: Project) => {
  return async (ctx: DefaultContext) => {
    const _collections = project.collections.map((collection) => {
      const components = collection.components.map((component) => {
        return getComponentFiles(component);
      });

      return {
        def: collection,
        components,
      };
    });

    const _rootComponents = project.rootComponents.map((component) => {
      return getComponentFiles(component);
    });

    // Render the HTML file into the template.
    const body = digestHtml(_collections, _rootComponents);

    // Return the result.
    ctx.body = body;
  };
};
