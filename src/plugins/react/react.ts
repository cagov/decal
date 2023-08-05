import { promises as fs } from "fs";

import { formatter } from "../web-component/web-component.js";
import { Format } from "../../format.js";
import { Scaffold, Scaffolder } from "../../scaffold.js";
import { Bundle, Bundler } from "../../bundle.js";
import { Collection } from "../../collection.js";
import { Component } from "../../component.js";

// Import scaffold templates.
import indexJsx from "./index.jsx.js";
import demoJsx from "./demo.jsx.js";
import demoHtml from "./demo.html.js";

export const ReactFormat = new Format("JSX/esbuild", {
  src: { extname: ".jsx" },
  dist: { extname: ".js" },
  formatter: formatter,
  include: false,
});

export const scaffolder: Scaffolder = async (component, names) => {
  const filePathBase = `${component.dir}/${names.camelCase}`;
  const bearFile = `${component.project.dirs.decal}/src/plugins/react/hard-hat-bear.jpg`;

  await Promise.all([
    fs.copyFile(bearFile, `${component.dir}/hard-hat-bear.jpg`),
    fs.writeFile(`${filePathBase}.jsx`, indexJsx(component, names)),
    fs.writeFile(`${filePathBase}.demo.html`, demoHtml(component, names)),
    fs.writeFile(`${filePathBase}.demo.jsx`, demoJsx(component, names)),
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

export default {
  Collection: ReactCollection,
  Component: ReactDef,
  Format: ReactFormat,
  Bundle: ReactBundle,
  Scaffolds: {
    Standard: ReactScaffoldScratch,
    FromWebComponent: ReactScaffoldWC,
  },
};
