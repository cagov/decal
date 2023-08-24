import { promises as fs } from "fs";

import { EsbuildFormat } from "../web-component/web-component.js";
import { Format } from "../../format.js";
import { Scaffold, Scaffolder } from "../../scaffold.js";
import { Collection } from "../../collection.js";
import { Component } from "../../component.js";

// Import scaffold templates.
import wcIndex from "./wc.index.jsx.js";
import wcDemo from "./wc.demo.jsx.js";
import scratchDemo from "./scratch.demo.jsx.js";
import scratchIndex from "./scratch.index.jsx.js";
import demoHtml from "./demo.html.js";
import path from "path";

export const ReactFormat = new Format({
  name: "JSX/esbuild",
  src: { extname: ".jsx" },
  dist: { extname: ".js" },
  formatter: EsbuildFormat.formatter,
  include: false,
});

export const wcScaffolder: Scaffolder = async (component) => {
  const filePathBase = `${component.dir}/${component.case.pascal}`;
  const bearFile = `${component.project.dirs.templates}/img/hard-hat-bear.jpg`;

  await fs.mkdir(`${component.project.dir}/assets`, { recursive: true });
  await Promise.all([
    fs.copyFile(bearFile, `${component.project.dir}/assets/hard-hat-bear.jpg`),
    fs.writeFile(`${filePathBase}.jsx`, wcIndex(component)),
    fs.writeFile(`${filePathBase}.demo.html`, demoHtml(component)),
    fs.writeFile(`${filePathBase}.demo.jsx`, wcDemo(component)),
  ]);

  console.log(
    "\nNote: you will likely need to add mark-up from the original web component source into this React version."
  );
};

export const ReactScaffoldWC = new Scaffold({
  name: "React from Web Component",
  dirNamer: (nameCase) => nameCase.pascal,
  scaffolder: wcScaffolder,
});

export const scratchScaffolder: Scaffolder = async (component) => {
  const filePathBase = `${component.dir}/${component.case.pascal}`;
  const bearFile = `${component.project.dirs.templates}/img/hard-hat-bear.jpg`;

  await fs.mkdir(`${component.project.dir}/assets`, { recursive: true });
  await Promise.all([
    fs.copyFile(bearFile, `${component.project.dir}/assets/hard-hat-bear.jpg`),
    fs.writeFile(`${filePathBase}.jsx`, scratchIndex(component)),
    fs.writeFile(`${filePathBase}.demo.html`, demoHtml(component)),
    fs.writeFile(`${filePathBase}.demo.jsx`, scratchDemo(component)),
  ]);
};

export const ReactScaffoldScratch = new Scaffold({
  name: "React from Scratch",
  dirNamer: (nameCase) => nameCase.pascal,
  scaffolder: scratchScaffolder,
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
  scaffolds: [ReactScaffoldWC, ReactScaffoldScratch],
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
