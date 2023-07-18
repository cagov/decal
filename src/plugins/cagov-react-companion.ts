import { getEnvironment, getRenderer } from "../nunjucks.js";
import { esbuildFormatter } from "./cagov-web-component.js";
import { Format, Formatter } from "../format.js";
import { Scaffolder } from "../scaffold.js";
import { promises as fs } from "fs";

const templatesDir = `scaffold/cagov-react-companion`;
const nunjucksEnv = getEnvironment(templatesDir);
const renderToFile = getRenderer(nunjucksEnv);

export const ReactFormat = new Format({
  name: "JSX via esbuild",
  entryPoints: ["react.jsx"],
  src: { extname: ".jsx" },
  dist: { extname: ".js" },
  formatter: esbuildFormatter,
});

export const ReactScaffolder: Scaffolder = async (dir, names, collection) => {
  const params = {
    names,
    collection,
  };

  await Promise.all([
    renderToFile("react-example.html.njk", `${dir}/demo`, params),
    renderToFile("react-example.jsx.njk", `${dir}/demo`, params),
    renderToFile("react.jsx.njk", `${dir}/src`, params),
  ]);
};
