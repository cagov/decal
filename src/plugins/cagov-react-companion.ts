import { getEnvironment, getRenderer } from "../nunjucks.js";
import { formatter } from "./cagov-web-component.js";
import { Format } from "../format.js";
import { Scaffolder } from "../scaffold.js";

const templatesDir = `scaffold/cagov-react-companion`;
const nunjucksEnv = getEnvironment(templatesDir);
const renderToFile = getRenderer(nunjucksEnv);

export const ReactFormat = new Format({
  name: "JSX via esbuild",
  entryPoint: "react.jsx",
  src: { extname: ".jsx" },
  dist: { extname: ".js" },
  formatter: formatter,
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
