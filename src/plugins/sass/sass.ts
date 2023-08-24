import { promises as fs } from "fs";
import sass from "sass";
import chalk from "chalk";
import url from "url";

import { Format, Formatter } from "../../format.js";
import { Collection } from "../../collection.js";
import { Scaffold, Scaffolder } from "../../scaffold.js";
import { Component } from "../../component.js";

// Import scaffold templates.
import demoHtml from "./demo.html.js";
import indexScss from "./index.scss.js";
import path from "path";

const formatter: Formatter = (filePath) =>
  sass
    .compileAsync(filePath, {
      sourceMap: false,
      sourceMapIncludeSources: false,
      importers: [
        {
          findFileUrl: (u) => {
            if (!u.startsWith("~")) return null;
            return new URL(
              `${url.pathToFileURL("node_modules")}/${u.substring(1)}`
            );
          },
        },
      ],
    })
    .then((result) => {
      const body = result.css;
      return body;
    })
    .catch((err) => {
      console.log(`\n${chalk.bgRed("** sass errors **")}\n`);
      console.log(err.message);
      console.log("\n");
      return "/* There are errors in this file. Check your Decal console. */";
    });

export const SassFormat = new Format({
  name: "CSS/Sass",
  entryPoint: (componentName) => `${componentName}.scss`,
  dist: { extname: ".css" },
  formatter: formatter,
});

const SassScaffolder: Scaffolder = async (component) => {
  const filePathBase = `${component.dir}/${component.case.param}`;
  const bearFile = `${component.project.dirs.templates}/img/hard-hat-bear.jpg`;

  const assetsPath = path.join(component.project.dir, "assets");
  await fs.mkdir(assetsPath, { recursive: true });
  await Promise.all([
    fs.copyFile(bearFile, path.join(assetsPath, "hard-hat-bear.jpg")),
    fs.writeFile(`${filePathBase}.scss`, indexScss(component)),
    fs.writeFile(`${filePathBase}.demo.html`, demoHtml(component)),
  ]);
};

export const SassScaffold = new Scaffold({
  name: "Standard Sass",
  scaffolder: SassScaffolder,
});

const SassBundleScaffolder: Scaffolder = async (bundle) => {
  const content = bundle.children
    .map((component) => {
      const entryPoint = SassFormat.entryPoint(component.dirName);
      return `@import "../../${component.posixSlug}/${entryPoint}";`;
    })
    .join("\n");

  const entryPoint = SassFormat.entryPoint(bundle.dirName);
  await fs.writeFile(path.join(bundle.dir, entryPoint), content);
};

export const SassBundleScaffold = new Scaffold({
  name: "Sass Bundle Refresher",
  scaffolder: SassBundleScaffolder,
  mode: "refresh",
});

export const SassBundleComponent = new Component({
  dirName: "sass-bundle",
  formats: [SassFormat],
  scaffolds: [SassBundleScaffold],
});

export const SassDef = new Component({
  dirName: "sass",
  formats: [SassFormat],
  scaffolds: [SassScaffold],
});

export const SassCollection = new Collection({
  dirName: "sass",
  component: SassDef,
  bundles: [SassBundleComponent],
});

export default {
  Collection: SassCollection,
  Component: SassDef,
  Format: SassFormat,
  Scaffold: SassScaffold,
};
