import * as path from "path";
import { promises as fs } from "fs";
import { DefaultContext } from "koa";
import { Project } from "../project.js";
import { IncludeMode } from "../include.js";
import { render } from "nunjucks";

type RenderAttributes = {
  content?: string;
  entryPoints: { name: string; id: string; enabled: boolean }[];
  scenarios: { name: string; id: string; enabled: boolean }[];
  includeTags: string[];
};

const entryPointHtml = (attrs: RenderAttributes) => {
  if (attrs.entryPoints.length > 0) {
    const entryPoints = attrs.entryPoints
      .map((entryPoint) => {
        return /* html */ `
          <div>
            <input
              type="checkbox"
              id="${entryPoint.id}"
              name="${entryPoint.id}" 
              ${entryPoint.enabled ? "checked" : ""} >
            <label for="${entryPoint.id}">${entryPoint.name}</label>
          </div>
        `;
      })
      .join("\n");

    const scenarios = () => {
      const optTags = attrs.scenarios.map((scenario) => {
        return /* html */ `
          <option
            value="${scenario.id}" 
            ${scenario.enabled ? "selected" : ""}
          >
            ${scenario.name}
          </option>
        `;
      });

      if (optTags.length > 0) {
        return /* html */ `
          <fieldset>
            <legend>Scenario:</legend>
            <select name="scenario">
              <option value="plain" selected>Plain</option>
              ${optTags.join("\n")}
            </select>
          </fieldset>
        `;
      } else {
        return "";
      }
    };

    return /* html */ `
      <form class="entrypoint-toggler">
        ${scenarios()}
        <fieldset>
          <legend>Sources:</legend>
          ${entryPoints}
        </fieldset>
        <button type="submit">Reload</button>
        <input type="hidden" id="reload" name="reload" value="true"/>
      </form>
    `;
  } else {
    return "";
  }
};

const htmlTemplate = (attrs: RenderAttributes) => {
  return /* html */ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgo=">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Component Test</title>
        <script id="live-reloader" type="module" src="/_scripts/ws.js"></script>
        <style>
          nav.digest-nav {
            padding: 1rem 2rem;
            background: silver;
            display: flex;
            gap: 3rem;
            align-items: start;
          }
          form.entrypoint-toggler {
            display: flex;
            gap: 3rem;
            align-items: start;
          }
          form.entrypoint-toggler select {
            all: revert;
            margin: .25rem 0;
            font-size: 1rem;
            padding: 0.5rem;
          }
          form.entrypoint-toggler button {
            background: white;
            padding: 0.5rem 1rem;
            font-size: 1.25rem;
            border: gray 0.25rem solid;
            border-radius: 1rem;
          }
        </style>
        ${attrs.includeTags.join("\n")}
      </head>
      <body>
        <nav class="digest-nav">
          <a href="/">⬅️ Back to digest</a>
          ${entryPointHtml(attrs)}
        </nav>
        ${attrs.content}
      </body>
    </html>
  `;
};

export const createHtmlHandler = (project: Project) => {
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
      scenarios: [],
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
        renderAttributes.content = str;
      });

    const component = project.components.find((component) =>
      ctx.path.startsWith(component.route)
    );

    const includers: Promise<void>[] = [];

    if (component) {
      component.formats.forEach((format) => {
        const include = format.include;
        const entryPoint = format.entryPoint(component.dirName);

        if (include.id !== "empty") {
          includers.push(
            fs
              .access(path.join(component.dir, entryPoint))
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

      const collectionIncludes = component?.collection?.includes || [];
      const otherIncludes = [...component.includes, ...collectionIncludes];
      const sourceIncludes = otherIncludes.filter(
        (include) => include.mode === IncludeMode.Source
      );

      sourceIncludes.forEach((include) => {
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

      const scenarioIncludes = otherIncludes.filter(
        (include) => include.mode === IncludeMode.Scenario
      );

      scenarioIncludes.forEach((include) => {
        includers.push(
          new Promise((resolve) => {
            const queryParam = query["scenario"];
            const enabled = queryParam === include.id;

            const tag = enabled ? include.tag("") : "";

            renderAttributes.scenarios.push({
              name: `${include.name}`,
              id: include.id,
              enabled,
            });

            if (tag) {
              renderAttributes.includeTags.push(tag);
            }

            if (enabled) {
              renderAttributes.content = include.templater(
                renderAttributes.content || ""
              );
            }

            resolve(void 0);
          })
        );
      });
    }

    await Promise.all(includers);

    // Render the HTML file into the template.
    const body = htmlTemplate(renderAttributes);

    // Return the result.
    ctx.body = body;
  };
};
