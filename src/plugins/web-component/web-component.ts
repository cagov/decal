import { promises as fs } from "fs";
import chalk from "chalk";
import esbuild from "esbuild";

import { Format, Formatter } from "../../format.js";
import { Collection } from "../../collection.js";
import { Scaffold, Scaffolder } from "../../scaffold.js";
import { Component } from "../../component.js";

// Import scaffold templates
import demoHtml from "./demo.html.js";
import litIndex from "./lit.index.js";
import standardIndex from "./standard.index.js";
import shadowCss from "./shadow.css.js";
import shadowHtml from "./shadow.html.js";
import path from "path";

export const formatter: Formatter = (filePath, _, options) => {
  const baseOptions = {
    entryPoints: [filePath],
    bundle: true,
    format: "esm",
    write: false,
    logLevel: "silent",
    loader: {
      ".css": "text",
      ".html": "text",
    },
  };

  const mergedOptions = Object.assign(baseOptions, options);

  return esbuild
    .build(mergedOptions)
    .then((result) => {
      const body = result.outputFiles[0].text;
      return body;
    })
    .catch(async (err) => {
      const warnings = await esbuild.formatMessages(err.warnings, {
        kind: "warning",
        color: true,
      });

      const errors = await esbuild.formatMessages(err.errors, {
        kind: "error",
        color: true,
      });

      console.log(`\n${chalk.bgRed("** esbuild errors **")}\n`);
      console.log([...errors, ...warnings].join("\n"));
      return "// There are errors in this file. Check your Decal console.";
    });
};

export const EsbuildFormat = new Format({
  name: "JS/esbuild",
  id: "js",
  extname: ".js",
  buildOptions: { minify: true },
  formatter,
});

const standardScaffolder: Scaffolder = async (component) => {
  const filePathBase = `${component.dir}/${component.case.param}`;
  const bearFile = `${component.project.dirs.templates}/img/hard-hat-bear.jpg`;

  await fs.mkdir(`${component.project.dir}/assets`, { recursive: true });
  await Promise.all([
    fs.copyFile(bearFile, `${component.project.dir}/assets/hard-hat-bear.jpg`),
    fs.writeFile(`${filePathBase}.js`, standardIndex(component)),
    fs.writeFile(`${filePathBase}.demo.html`, demoHtml(component)),
    fs.writeFile(`${filePathBase}.shadow.html`, shadowHtml(component)),
    fs.writeFile(`${filePathBase}.shadow.css`, shadowCss(component)),
  ]);
};

export const StandardScaffold = new Scaffold({
  name: "Standard Web Component",
  scaffolder: standardScaffolder,
});

const litScaffolder: Scaffolder = async (component) => {
  const filePathBase = `${component.dir}/${component.case.param}`;
  const bearFile = `${component.project.dirs.templates}/img/hard-hat-bear.jpg`;

  await fs.mkdir(`${component.project.dir}/assets`, { recursive: true });
  await Promise.all([
    fs.copyFile(bearFile, `${component.project.dir}/assets/hard-hat-bear.jpg`),
    fs.writeFile(`${filePathBase}.js`, litIndex(component)),
    fs.writeFile(`${filePathBase}.demo.html`, demoHtml(component)),
  ]);
};

export const LitScaffold = new Scaffold({
  name: "Lit-Element Web Component",
  scaffolder: litScaffolder,
});

export const BundleScaffolder: Scaffolder = async (bundle) => {
  const content = bundle.children
    .map((component) => {
      const entryPoint = component.entryPoints.get("js");
      return `import '../../${component.posixSlug}/${entryPoint}';`;
    })
    .join("\n");

  const entryPoint = `${bundle.entryPoints.get("js")}`;
  await fs.writeFile(path.join(bundle.dir, entryPoint), content);
};

export const BundleScaffold = new Scaffold({
  name: "Web Component Bundle Refresher",
  scaffolder: BundleScaffolder,
  mode: "refresh",
});

export const BundleComponent = new Component({
  dirName: "web-component-bundle",
  formats: [EsbuildFormat],
  scaffolds: [BundleScaffold],
});

export const WCDefinition = new Component({
  dirName: "web-component",
  formats: [EsbuildFormat],
  scaffolds: [StandardScaffold, LitScaffold],
});

export const WCCollection = new Collection({
  dirName: "web-components",
  component: WCDefinition,
  bundles: [BundleComponent],
});

export default {
  Collection: WCCollection,
  Component: WCDefinition,
  Format: EsbuildFormat,
  Scaffolds: {
    Lit: LitScaffold,
    Standard: StandardScaffold,
  },
};
