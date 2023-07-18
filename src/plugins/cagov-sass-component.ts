import { promises as fs } from "fs";
import sass from "sass";
import chalk from "chalk";
import url from "url";
import { getEnvironment, getRenderer } from "../nunjucks.js";
import { Format, Formatter } from "../format.js";
import { Collection } from "../collection.js";
import { Scaffold, Scaffolder } from "../scaffold.js";

const templatesDir = `templates/scaffold/cagov-sass-component`;
const nunjucksEnv = getEnvironment(templatesDir);
const renderToFile = getRenderer(nunjucksEnv);

const sassRenderer: Formatter = (filePath) =>
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
  name: "CSS via Sass",
  entryPoints: ["index.scss"],
  src: { extname: ".scss" },
  dist: { extname: ".css" },
  formatter: sassRenderer,
});

const SassScaffolder: Scaffolder = async (dir, names, collection) => {
  const params = {
    names,
    collection,
  };

  await Promise.all([
    fs.copyFile(
      `${templatesDir}/hard-hat-bear.jpg`,
      `${dir}/demo/hard-hat-bear.jpg`
    ),
    renderToFile("index.html.njk", `${dir}/demo`, params),
    renderToFile("index.scss.njk", `${dir}/src`, params),
  ]);
};

export const SassScaffold = new Scaffold({
  scaffolder: SassScaffolder,
});

export const SassCollection = new Collection({
  name: "Sass Components",
  formats: [SassFormat],
  scaffolds: [SassScaffold],
});
