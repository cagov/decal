import { promises as fs } from "fs";
import chalk from "chalk";
import esbuild from "esbuild";
import { getEnvironment, getRenderer } from "../nunjucks.js";

export default (decalConfig) => {
  const { dirs } = decalConfig;

  const templatesDir = `${dirs.templates}/scaffold/cagov-web-component`;
  const nunjucksEnv = getEnvironment(templatesDir);
  const renderToFile = getRenderer(nunjucksEnv);

  decalConfig.addLoader("esbuild-loader", {
    name: "JavaScript via esbuild",
    processorID: "esbuild",
    entryPoints: ["index.js"],
    tagID: "module-tag",
  });

  decalConfig.addLoader("plain-css-loader", {
    name: "Plain CSS",
    processorID: "passthrough",
    entryPoints: ["index.css"],
    tagID: "css-tag",
  });

  decalConfig.addProcessor("esbuild", (filePath) =>
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
      })
  );

  decalConfig.addProcessor("passthrough", (_, contents) => contents);

  decalConfig.addScaffold(
    "cagov-web-component-scaffold",
    async (dir, names, collection) => {
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
        renderToFile("index.js.njk", `${dir}/src`, params),
        renderToFile("shadow.styles.css.njk", `${dir}/src`),
        renderToFile("shadow.template.html.njk", `${dir}/src`, params),
      ]);
    }
  );
};
