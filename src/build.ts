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
      collection.formats.forEach((format) => {
        const formatter = format.formatter;
        const entryPoint = format.entryPoint(component.name);
        const exitPoint = format.exitPoint(component.name);

        if (formatter && exitPoint) {
          const filePath = `${component.dir}/${entryPoint}`;

          const promise = fs
            .readFile(filePath, "utf-8")
            .catch((err) => {
              throw new FileReadError(err.message, err.code, err.path);
            })
            .then((contents) => formatter(filePath, contents))
            .then(async (result) => {
              const outFilePath = `${dirs.target}/_dist/${collection.dirName}/${exitPoint}`;
              const outFileDir = path.dirname(outFilePath);

              await fs.mkdir(outFileDir, { recursive: true });
              return fs.writeFile(outFilePath, result).then(() => {
                console.log(
                  `${chalk.magenta(format.name)}: ${dirs.relative(outFilePath)}`
                );
              });
            })
            .catch((err) => {
              if (!(err.name === "FileReadError")) {
                console.log(err.message);
              }
            });

          builders.push(promise);
        }
      });
    });
  });

  const buildPath = dirs.relative(dirs.target);

  console.log("Entering build mode");
  console.log(`Sourcing from ${dirs.relative(dirs.target)}`);
  console.log(`Building to ${dirs.relative(dirs.target)}/_dist\n`);

  await Promise.all(builders);
};
