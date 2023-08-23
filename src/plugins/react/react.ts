import { promises as fs } from "fs";

import { EsbuildFormat } from "../web-component/web-component.js";
import { Format } from "../../format.js";
import { Scaffold, Scaffolder } from "../../scaffold.js";
import { Collection } from "../../collection.js";
import { Component } from "../../component.js";

// Import scaffold templates.
import indexJsx from "./index.jsx.js";
import demoJsx from "./demo.jsx.js";
import demoHtml from "./demo.html.js";
import path from "path";

export const ReactFormat = new Format({
  name: "JSX/esbuild",
  src: { extname: ".jsx" },
  dist: { extname: ".js" },
  formatter: EsbuildFormat.formatter,
  include: false,
});

export const scaffolder: Scaffolder = async (component) => {
  const filePathBase = `${component.dir}/${component.case.pascal}`;
  const bearFile = `${component.project.dirs.decal}/src/plugins/react/hard-hat-bear.jpg`;

  await Promise.all([
    fs.copyFile(bearFile, `${component.dir}/hard-hat-bear.jpg`),
    fs.writeFile(`${filePathBase}.jsx`, indexJsx(component)),
    fs.writeFile(`${filePathBase}.demo.html`, demoHtml(component)),
    fs.writeFile(`${filePathBase}.demo.jsx`, demoJsx(component)),
  ]);
};

export const ReactScaffoldWC = new Scaffold({
  name: "React from Web Component",
  dirNamer: (nameCase) => nameCase.pascal,
  scaffolder,
});

export const BundleScaffolder: Scaffolder = async (bundle) => {
  const content = bundle.children
    .map((component) => {
      const entryPoint = ReactFormat.entryPoint(component.dirName);
      return `export * from '../../${component.posixSlug}/${entryPoint}';`;
    })
    .join("\n");

  const entryPoint = ReactFormat.entryPoint(bundle.dirName);
  await fs.writeFile(path.join(bundle.dir, entryPoint), content);
};

export const BundleScaffold = new Scaffold({
  name: "React Bundle Refresher",
  scaffolder: BundleScaffolder,
  mode: "refresh",
});

export const BundleComponent = new Component({
  dirName: "react-bundle",
  formats: [ReactFormat],
  scaffolds: [BundleScaffold],
});

export const ReactDef = new Component({
  dirName: "react",
  formats: [ReactFormat],
  scaffolds: [ReactScaffoldWC],
});

export const ReactCollection = new Collection({
  dirName: "react",
  component: ReactDef,
  bundles: [BundleComponent],
});

export default {
  Collection: ReactCollection,
  Component: ReactDef,
  Format: ReactFormat,
  Scaffolds: {
    FromWebComponent: ReactScaffoldWC,
  },
};
