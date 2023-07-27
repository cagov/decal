import { getEnvironment, getRenderer } from "../nunjucks.js";
import { promises as fs } from "fs";

import { formatter } from "./cagov-web-component.js";
import { Format } from "../format.js";
import { Scaffold, Scaffolder } from "../scaffold.js";
import { Bundle, Bundler } from "../bundle.js";
import { Collection } from "../collection.js";

const templatesDir = `templates/scaffold/cagov-react-companion`;
const nunjucksEnv = getEnvironment(templatesDir);
const renderToFile = getRenderer(nunjucksEnv);

export const ReactFormat = new Format({
  name: "JSX/esbuild",
  src: { extname: ".jsx" },
  dist: { extname: ".js" },
  formatter: formatter,
  include: false,
});

export const scaffolder: Scaffolder = async (dir, names, collection) => {
  const params = {
    names,
    collection,
  };

  await Promise.all([
    renderToFile(
      "react-example.html.njk",
      `${dir}/${names.camelCase}.demo.html`,
      params
    ),
    renderToFile(
      "react-example.jsx.njk",
      `${dir}/${names.camelCase}.demo.jsx`,
      params
    ),
    renderToFile("react.jsx.njk", `${dir}/${names.camelCase}.jsx`, params),
  ]);
};

export const ReactScaffold = new Scaffold({
  dirNamer: (names) => names.camelCase,
  scaffolder,
});

const bundler: Bundler = async (collection) => {
  const inserts = collection.components
    .map((component) => {
      const entryPoint = ReactFormat.entryPoint(component.name);
      return `import '../${component.slug}/${entryPoint}';`;
    })
    .join("\n");

  const tempPath = `${collection.projectDir}/_temp`;
  await fs.mkdir(tempPath, { recursive: true });

  const tempFilePath = `${tempPath}/${collection.dirName}.react.bundle.js`;
  await fs.writeFile(tempFilePath, inserts);

  const bundleResult = await formatter(tempFilePath, inserts);
  const bundleContent = `${bundleResult}`;

  const bundlePath = `${collection.projectDir}/_dist/bundles`;
  await fs.mkdir(bundlePath, { recursive: true });

  const bundleFilePath = `${bundlePath}/${collection.dirName}.react.bundle.js`;
  await fs.writeFile(bundleFilePath, bundleContent);
};

export const ReactBundle = new Bundle("React Components Bundle", bundler);

export const ReactCollection = new Collection({
  name: "React Components",
  formats: [ReactFormat],
  scaffolds: [ReactScaffold],
  bundles: [ReactBundle],
});
