import { promises as fs } from "fs";
import chalk from "chalk";
import url from "url";
import postcss from "postcss";
import atImport from "postcss-import";
import path from "path";

import { Format, Formatter } from "../../format.js";
import { Collection } from "../../collection.js";
import { Scaffold, Scaffolder } from "../../scaffold.js";
import { Component } from "../../component.js";

// Import scaffold templates.
import demoHtml from "./demo.html.js";
import indexCss from "./index.css.js";

const formatter: Formatter = (filePath, contents, options) => {
  const { plugins = [], ...opts } = options;

  const mergedPlugins = [atImport, ...plugins];
  const mergedOpts = Object.assign(opts, {
    to: filePath,
    from: filePath,
  });

  return postcss(mergedPlugins)
    .process(contents, mergedOpts)
    .then((result) => {
      return result.css;
    })
    .catch((error) => {
      if (error.name === "CssSyntaxError") {
        console.log(`\n${chalk.bgRed("** postcss errors **")}\n`);
        console.log(`${error.message}\n`);
        console.log(`${error.showSourceCode()}\n`);
      }
      return "// There are errors in this file. Check your Decal console.";
    });
};

export const PostCSSFormat = new Format({
  name: "CSS/PostCSS",
  id: "css",
  entryPoint: (componentName) => `${componentName}.css`,
  dist: { extname: ".css" },
  formatter,
});

const PostCSSScaffolder: Scaffolder = async (component) => {
  const filePathBase = `${component.dir}/${component.case.param}`;
  const bearFile = `${component.project.dirs.templates}/img/hard-hat-bear.jpg`;

  const assetsPath = path.join(component.project.dir, "assets");
  await fs.mkdir(assetsPath, { recursive: true });
  await Promise.all([
    fs.copyFile(bearFile, path.join(assetsPath, "hard-hat-bear.jpg")),
    fs.writeFile(`${filePathBase}.css`, indexCss(component)),
    fs.writeFile(`${filePathBase}.demo.html`, demoHtml(component)),
  ]);
};

export const PostCSSScaffold = new Scaffold({
  name: "Standard CSS",
  scaffolder: PostCSSScaffolder,
});

const PostCSSBundleScaffolder: Scaffolder = async (bundle) => {
  const content = bundle.children
    .map((component) => {
      const entryPoint = component.entryPoints.get("css");
      return `@import "../../${component.posixSlug}/${entryPoint}";`;
    })
    .join("\n");

  const entryPoint = bundle.entryPoints.get("css") || "";
  await fs.writeFile(path.join(bundle.dir, entryPoint), content);
};

export const PostCSSBundleScaffold = new Scaffold({
  name: "PostCSS Bundle Refresher",
  scaffolder: PostCSSBundleScaffolder,
  mode: "refresh",
});

export const PostCSSBundleComponent = new Component({
  dirName: "styles-bundle",
  formats: [PostCSSFormat],
  scaffolds: [PostCSSBundleScaffold],
});

export const PostCSSDef = new Component({
  dirName: "style",
  formats: [PostCSSFormat],
  scaffolds: [PostCSSScaffold],
});

export const PostCSSCollection = new Collection({
  dirName: "styles",
  component: PostCSSDef,
  bundles: [PostCSSBundleComponent],
});

export default {
  Collection: PostCSSCollection,
  Component: PostCSSDef,
  Format: PostCSSFormat,
  Scaffold: PostCSSScaffold,
};
