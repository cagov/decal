import { promises as fs } from "fs";
import sass from "sass";
import chalk from "chalk";
import url from "url";
import { getEnvironment, getRenderer } from "../nunjucks.js";
import { Format, Formatter } from "../format.js";
import { Collection } from "../collection.js";
import { Scaffold, Scaffolder } from "../scaffold.js";
import { Bundle, Bundler } from "../bundle.js";

const templatesDir = `templates/scaffold/cagov-sass-component`;
const nunjucksEnv = getEnvironment(templatesDir);
const renderToFile = getRenderer(nunjucksEnv);

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

export const SassFormat = new Format("CSS/Sass", {
  entryPoint: (componentName) => `src/${componentName}.scss`,
  src: { extname: ".scss" },
  dist: { extname: ".css" },
  formatter: formatter,
});

const SassScaffolder: Scaffolder = async (dir, names, collection) => {
  const params = {
    names,
    collection,
  };

  await Promise.all([
    fs.copyFile(
      `${templatesDir}/hard-hat-bear.jpg`,
      `${dir}/hard-hat-bear.jpg`
    ),
    renderToFile(
      "index.html.njk",
      `${dir}/${names.kebabCase}.demo.html`,
      params
    ),
    renderToFile("index.scss.njk", `${dir}/${names.kebabCase}.scss`, params),
  ]);
};

export const SassScaffold = new Scaffold("Standard Sass", {
  scaffolder: SassScaffolder,
});

const bundler: Bundler = async (collection) => {
  const inserts = collection.components
    .map((component) => {
      const entryPoint = SassFormat.entryPoint(component.name);
      return `@import "../${component.slug}/${entryPoint}";`;
    })
    .join("\n");

  const tempPath = `${collection.project.dir}/_temp`;
  await fs.mkdir(tempPath, { recursive: true });

  const tempFilePath = `${tempPath}/${collection.dirName}.bundle.scss`;
  await fs.writeFile(tempFilePath, inserts);

  const bundleResult = await formatter(tempFilePath, inserts);
  const bundleContent = bundleResult;

  const bundlePath = `${collection.project.dir}/_dist/bundles`;
  await fs.mkdir(bundlePath, { recursive: true });

  const bundleFilePath = `${bundlePath}/${collection.dirName}.bundle.css`;
  await fs.writeFile(bundleFilePath, bundleContent);
};

export const SassComponentsBundle = new Bundle(
  "Web Components Bundle",
  bundler
);

export const SassCollection = new Collection("Sass Styles", {
  formats: [SassFormat],
  scaffolds: [SassScaffold],
  bundles: [SassComponentsBundle],
});
