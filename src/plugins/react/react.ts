import { promises as fs } from "fs";

import { formatter } from "../web-component/web-component.js";
import { Format, Bundler } from "../../format.js";
import { Scaffold, Scaffolder } from "../../scaffold.js";
import { Collection } from "../../collection.js";
import { Component } from "../../component.js";

// Import scaffold templates.
import indexJsx from "./index.jsx.js";
import demoJsx from "./demo.jsx.js";
import demoHtml from "./demo.html.js";

const bundler: Bundler = (collection) => {
  const inserts = collection.components
    .map((component) => {
      const entryPoint = ReactFormat.entryPoint(component.dirName);
      return `import { ${component.dirName} } from '../../${component.slug}/${entryPoint}';`;
    })
    .join("\n");

  return `import * as React from 'react'\n\n${inserts}`;
};

export const ReactFormat = new Format("JSX/esbuild", {
  src: { extname: ".jsx" },
  dist: { extname: ".js" },
  formatter: formatter,
  include: false,
  bundler: bundler,
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

export const ReactDef = new Component("React Components", {
  formats: [ReactFormat],
  scaffolds: [ReactScaffoldWC, ReactScaffoldScratch],
});

export const ReactCollection = new Collection("React Components", ReactDef, {
  dirName: "react",
  bundleDirName: "AllReact",
});

export default {
  Collection: ReactCollection,
  Component: ReactDef,
  Format: ReactFormat,
  Scaffolds: {
    Standard: ReactScaffoldScratch,
    FromWebComponent: ReactScaffoldWC,
  },
};
