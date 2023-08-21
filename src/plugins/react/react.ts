import { promises as fs } from "fs";

import { formatter } from "../web-component/web-component.js";
import { Format } from "../../format.js";
import { Scaffold, Scaffolder } from "../../scaffold.js";
import { Collection } from "../../collection.js";
import { Component } from "../../component.js";

// Import scaffold templates.
import indexJsx from "./index.jsx.js";
import demoJsx from "./demo.jsx.js";
import demoHtml from "./demo.html.js";

export const ReactFormat = new Format({
  name: "JSX/esbuild",
  src: { extname: ".jsx" },
  dist: { extname: ".js" },
  formatter: formatter,
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

export const ReactDef = new Component({
  dirName: "react",
  formats: [ReactFormat],
  scaffolds: [ReactScaffoldWC],
});

export const ReactCollection = new Collection({
  dirName: "react",
  component: ReactDef,
});

export default {
  Collection: ReactCollection,
  Component: ReactDef,
  Format: ReactFormat,
  Scaffolds: {
    FromWebComponent: ReactScaffoldWC,
  },
};
