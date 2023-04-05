import { promises as fs } from "fs";
import * as path from "path";
import chalk from "chalk";
import { Config } from "./config.js";
import { FileReadError } from "./errors.js";

// Build and bundle CSS and JS.
export const build = async (config: Config) => {
  const { dirs, collections } = config;

  const builders: Promise<void>[] = [];

  collections.forEach((collection) => {
    collection.components.forEach((component) => {
      collection.loaders.forEach((loader) => {
        const processor = loader.processor;

        if (processor) {
          const filePaths = loader.entryPoints.map(
            (entryPoint) => `${component.dir}/src/${entryPoint}`
          );

          filePaths.forEach((filePath) => {
            const promise = fs
              .readFile(filePath, "utf-8")
              .catch((err) => {
                throw new FileReadError(err.message, err.code, err.path);
              })
              .then((contents) => processor(filePath, contents))
              .then(async (result) => {
                const outFilePath = filePath
                  .replace(loader.src.extname, loader.dist.extname)
                  .replace("/src", "")
                  .replace(dirs.target, `${dirs.target}/dist`);

                const outFileDir = path.dirname(outFilePath);

                await fs.mkdir(outFileDir, { recursive: true });
                return fs.writeFile(outFilePath, result).then(() => {
                  console.log(
                    `${chalk.magenta(loader.name)}: ${dirs.relative(
                      outFilePath
                    )}`
                  );
                });
              })
              .catch((err) => {
                if (!(err.name === "FileReadError")) {
                  console.log(err.message);
                }
              });

            builders.push(promise);
          });
        }
      });
    });
  });

  const buildPath = dirs.relative(dirs.target);

  console.log("Entering build mode");
  console.log(`Sourcing from ${dirs.relative(dirs.target)}`);
  console.log(`Building to ${dirs.relative(dirs.target)}/dist\n`);

  await Promise.all(builders);
};
