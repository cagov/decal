import { promises as fs } from "fs";
import * as path from "path";
import chalk from "chalk";
import { Config } from "./config.js";
import { FileReadError } from "./errors.js";

// Build and bundle CSS and JS.
export const build = async (config: Config) => {
  const { project } = config;

  const builders: Promise<void>[] = [];

  project.collections.forEach((collection) => {
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
              const outFile = `${project.dir}/_dist/${collection.dirName}/${exitPoint}`;
              const outDir = path.dirname(outFile);

              await fs.mkdir(outDir, { recursive: true });
              return fs.writeFile(outFile, result).then(() => {
                const loggablePath = project.dirs.relative(outFile);
                console.log(`${chalk.magenta(format.name)}: ${loggablePath}`);
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

  const buildPath = project.dirs.relative(project.dir);

  console.log("Entering build mode");
  console.log(`Sourcing from ${project.dirs.relative(project.dir)}`);
  console.log(`Building to ${project.dirs.relative(project.dir)}/_dist\n`);

  await Promise.all(builders);
};
