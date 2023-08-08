import { promises as fs } from "fs";
import chalk from "chalk";
import esbuild from "esbuild";

import { Format, Formatter, Bundler } from "../../format.js";
import { Collection } from "../../collection.js";
import { Scaffold, Scaffolder } from "../../scaffold.js";
import { Component } from "../../component.js";

// Import scaffold templates
import demoHtml from "./demo.html.js";
import litIndex from "./lit.index.js";
import standardIndex from "./standard.index.js";
import shadowCss from "./shadow.css.js";
import shadowHtml from "./shadow.html.js";

export const formatter: Formatter = (filePath) =>
  esbuild
    .build({
      entryPoints: [filePath],
      bundle: true,
      format: "esm",
      write: false,
      logLevel: "silent",
      loader: {
        ".css": "text",
        ".html": "text",
        //".js": "jsx",
      },
      //jsxImportSource: "react",
      //platform: "neutral",
      //jsx: "automatic",
      //jsxSideEffects: true,
    })
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

const bundler: Bundler = (collection) => {
  return collection.components
    .map((component) => {
      const entryPoint = EsbuildFormat.entryPoint(component.dirName);
      return `import '../../${component.slug}/${entryPoint}';`;
    })
    .join("\n");
};

export const EsbuildFormat = new Format("JS/esbuild", {
  extname: ".js",
  formatter,
  bundler,
});

const standardScaffolder: Scaffolder = async (component, names) => {
  const filePathBase = `${component.dir}/${names.kebabCase}`;
  const bearFile = `${component.project.dirs.decal}/src/plugins/web-component/hard-hat-bear.jpg`;

  await Promise.all([
    fs.copyFile(bearFile, `${component.dir}/hard-hat-bear.jpg`),
    fs.writeFile(`${filePathBase}.js`, standardIndex(component, names)),
    fs.writeFile(`${filePathBase}.demo.html`, demoHtml(component, names)),
    fs.writeFile(`${filePathBase}.shadow.html`, shadowHtml(component, names)),
    fs.writeFile(`${filePathBase}.shadow.css`, shadowCss(component, names)),
  ]);
};

export const StandardScaffold = new Scaffold("Standard Web Component", {
  scaffolder: standardScaffolder,
});

const litScaffolder: Scaffolder = async (component, names) => {
  const filePathBase = `${component.dir}/${names.kebabCase}`;
  const bearFile = `${component.project.dirs.decal}/src/plugins/web-component/hard-hat-bear.jpg`;

  await Promise.all([
    fs.copyFile(bearFile, `${component.dir}/hard-hat-bear.jpg`),
    fs.writeFile(`${filePathBase}.js`, litIndex(component, names)),
    fs.writeFile(`${filePathBase}.demo.html`, demoHtml(component, names)),
  ]);
};

export const LitScaffold = new Scaffold("Lit-Element Web Component", {
  scaffolder: litScaffolder,
});

export const WCDefinition = new Component("Web Components", {
  formats: [EsbuildFormat],
  scaffolds: [StandardScaffold, LitScaffold],
});

export const WCCollection = new Collection("Web Components", WCDefinition, {
  dirName: "web-components",
  bundleDirName: "all-web-components",
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
