import { promises as fs } from "fs";
import sass from "sass";
import chalk from "chalk";
import url from "url";

import { Format, Formatter, Bundler } from "../../format.js";
import { Collection } from "../../collection.js";
import { Scaffold, Scaffolder } from "../../scaffold.js";
import { Component } from "../../component.js";

// Import scaffold templates.
import demoHtml from "./demo.html.js";
import indexScss from "./index.scss.js";

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

const bundler: Bundler = (collection) => {
  return collection.components
    .map((component) => {
      const entryPoint = SassFormat.entryPoint(component.dirName);
      return `@import "../../${component.slug}/${entryPoint}";`;
    })
    .join("\n");
};

export const SassFormat = new Format("CSS/Sass", {
  entryPoint: (componentName) => `${componentName}.scss`,
  dist: { extname: ".css" },
  formatter: formatter,
  bundler: bundler,
});

const SassScaffolder: Scaffolder = async (component, names) => {
  const filePathBase = `${component.dir}/${names.kebabCase}`;
  const bearFile = `${component.project.dirs.decal}/src/plugins/sass/hard-hat-bear.jpg`;

  await Promise.all([
    fs.copyFile(bearFile, `${component.dir}/hard-hat-bear.jpg`),
    fs.writeFile(`${filePathBase}.scss`, indexScss(component, names)),
    fs.writeFile(`${filePathBase}.demo.html`, demoHtml(component, names)),
  ]);
};

export const SassScaffold = new Scaffold("Standard Sass", {
  scaffolder: SassScaffolder,
});

export const SassDef = new Component("Sass Styles", {
  formats: [SassFormat],
  scaffolds: [SassScaffold],
});

export const SassCollection = new Collection("Sass Styles", SassDef, {
  dirName: "styles",
  bundleDirName: "all-styles",
});

export default {
  Collection: SassCollection,
  Component: SassDef,
  Format: SassFormat,
  Scaffold: SassScaffold,
};
