import { promises as fs } from "fs";
import chalk from "chalk";
import esbuild from "esbuild";
import { getEnvironment, getRenderer } from "../nunjucks.js";
import { Format, Formatter } from "../format.js";
import { Collection } from "../collection.js";
import { Scaffold, Scaffolder } from "../scaffold.js";
import { Bundle, Bundler } from "../bundle.js";

const templatesDir = `templates/scaffold/cagov-web-component`;
const nunjucksEnv = getEnvironment(templatesDir);
const renderToFile = getRenderer(nunjucksEnv);

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
      },
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

export const EsbuildFormat = new Format("JS/esbuild", {
  extname: ".js",
  formatter,
});

/*
export const PlainCssFormat = new Format({
  name: "Plain CSS",
  entryPoint: "index.css",
});
*/

const scaffolder: Scaffolder = async (dir, names, collection) => {
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
    renderToFile("index.js.njk", `${dir}/${names.kebabCase}.js`, params),
    renderToFile(
      "shadow.styles.css.njk",
      `${dir}/${names.kebabCase}.shadow.css`
    ),
    renderToFile(
      "shadow.template.html.njk",
      `${dir}/${names.kebabCase}.shadow.html`,
      params
    ),
  ]);
};

export const WebComponentScaffold = new Scaffold("Standard Web Component", {
  scaffolder,
});

const bundler: Bundler = async (collection) => {
  const inserts = collection.components
    .map((component) => {
      const entryPoint = EsbuildFormat.entryPoint(component.name);
      return `import '../${component.slug}/${entryPoint}';`;
    })
    .join("\n");

  const tempPath = `${collection.project.dir}/_temp`;
  await fs.mkdir(tempPath, { recursive: true });

  const tempFilePath = `${tempPath}/${collection.dirName}.bundle.js`;
  await fs.writeFile(tempFilePath, inserts);

  const bundleResult = await formatter(tempFilePath, inserts);
  const bundleContent = `// Signature\n${bundleResult}`;

  const bundlePath = `${collection.project.dir}/_dist/bundles`;
  await fs.mkdir(bundlePath, { recursive: true });

  const bundleFilePath = `${bundlePath}/${collection.dirName}.bundle.js`;
  await fs.writeFile(bundleFilePath, bundleContent);
};

export const WebComponentBundle = new Bundle("Web Components Bundle", bundler);

export const WebComponentCollection = new Collection("Web Components", {
  formats: [EsbuildFormat],
  scaffolds: [WebComponentScaffold],
  bundles: [WebComponentBundle],
});
