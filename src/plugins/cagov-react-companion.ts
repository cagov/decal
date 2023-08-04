import { getEnvironment, getRenderer } from "../nunjucks.js";
import { promises as fs } from "fs";

import { formatter } from "./cagov-web-component.js";
import { Format } from "../format.js";
import { Scaffold, Scaffolder } from "../scaffold.js";
import { Bundle, Bundler } from "../bundle.js";
import { Collection } from "../collection.js";
import { Component } from "../component.js";

const templatesDir = `templates/scaffold/cagov-react-companion`;
const nunjucksEnv = getEnvironment(templatesDir);
const renderToFile = getRenderer(nunjucksEnv);

export const ReactFormat = new Format("JSX/esbuild", {
  src: { extname: ".jsx" },
  dist: { extname: ".js" },
  formatter: formatter,
  include: false,
});

export const scaffolder: Scaffolder = async (component, names) => {
  const params = {
    names,
    component,
  };

  await Promise.all([
    renderToFile(
      "react-example.html.njk",
      `${component.dir}/${names.camelCase}.demo.html`,
      params
    ),
    renderToFile(
      "react-example.jsx.njk",
      `${component.dir}/${names.camelCase}.demo.jsx`,
      params
    ),
    renderToFile(
      "react.jsx.njk",
      `${component.dir}/${names.camelCase}.jsx`,
      params
    ),
  ]);
};

export const ReactScaffoldWC = new Scaffold("React from Web Component", {
  dirNamer: (names) => names.camelCase,
  scaffolder,
});

export const ReactScaffoldScratch = new Scaffold("React from scratch", {
  dirNamer: (names) => names.camelCase,
  scaffolder,
});

const bundler: Bundler = async (collection) => {
  const inserts = collection.components
    .map((component) => {
      const entryPoint = ReactFormat.entryPoint(component.dirName);
      return `import ${component.dirName} from '../${component.slug}/${entryPoint}';`;
    })
    .join("\n");

  const tempPath = `${collection.project.dir}/_temp`;
  await fs.mkdir(tempPath, { recursive: true });

  const tempFilePath = `${tempPath}/${collection.dirName}.bundle.js`;
  await fs.writeFile(tempFilePath, inserts);

  const bundleResult = await formatter(tempFilePath, inserts);
  const bundleContent = `${bundleResult}`;

  const bundlePath = `${collection.project.dir}/_dist/bundles`;
  await fs.mkdir(bundlePath, { recursive: true });

  const bundleFilePath = `${bundlePath}/${collection.dirName}.bundle.js`;
  await fs.writeFile(bundleFilePath, bundleContent);
};

export const ReactBundle = new Bundle("React Components Bundle", bundler);

export const ReactDef = new Component("React Components", {
  formats: [ReactFormat],
  scaffolds: [ReactScaffoldWC, ReactScaffoldScratch],
});

export const ReactCollection = new Collection("React Components", ReactDef, {
  bundles: [ReactBundle],
});
