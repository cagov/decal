import { promises as fs } from "fs";
import nunjucks from "nunjucks";
import sass from "sass";
import chalk from "chalk";
import url from "url";
import { getEnvironment, getRenderer } from "../nunjucks.js";

export default (decalConfig) => {
  const { dirs } = decalConfig;

  const templatesDir = `${dirs.templates}/scaffold/cagov-sass-component`;
  const nunjucksEnv = getEnvironment(templatesDir);
  const renderToFile = getRenderer(nunjucksEnv);

  decalConfig.addLoader("sass-loader", {
    name: "CSS via Sass",
    processorID: "sass",
    entryPoints: ["index.scss"],
    tagID: "css-tag",
    src: { extname: ".scss" },
    dist: { extname: ".css" },
  });

  decalConfig.addProcessor("sass", (filePath) =>
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
      })
  );

  decalConfig.addScaffold(
    "cagov-sass-component-scaffold",
    async (dir, names, collection) => {
      const params = {
        names,
        collection,
      };

      await Promise.all([
        fs.copyFile(
          `${templatesDir}/hard-hat-bear.jpg`,
          `${dir}/examples/hard-hat-bear.jpg`
        ),
        renderToFile("index.html.njk", `${dir}/examples`, params),
        renderToFile("index.scss.njk", `${dir}/src`, params),
      ]);
    }
  );
};
