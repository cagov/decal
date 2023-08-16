#! /usr/bin/env node

import yargs, { Argv, Arguments } from "yargs";
import { hideBin } from "yargs/helpers";

import { Config } from "./config.js";
import { serve } from "./serve/serve.js";
import { Scaffold } from "./scaffold.js";
import { Project } from "./project.js";

/**
 * Adds common CLI-option configurations to any yargs CLI command.
 * @param y The yargs.Argv configuration object.
 * @returns A new yargs.Argv configuration object with our additions.
 */
function addCommonArgv(y: Argv) {
  y.option("dir", {
    describe: "Set the folder that contains your Design System project.",
    default: "",
    alias: "d",
  }).option("conf", {
    describe: "Point to your Decal configuration file.",
    default: "decal.config.js",
    alias: "c",
  });

  return y as Argv<{
    dir: string;
    conf: string;
  }>;
}

yargs(hideBin(process.argv))
  .command(
    "serve",
    "Start Decal's development server.",
    (y) =>
      addCommonArgv(y).option("port", {
        describe: "Provide a port number for the dev server.",
        default: 3000,
        alias: "p",
      }),
    async (argv) => {
      const config = await Config.new(argv.dir, argv.conf);
      serve(config.project, argv.port);
    }
  )
  .command(
    "build",
    "Build the project's components for publication, a la carte.",
    (y) => addCommonArgv(y),
    async (argv) => {
      const config = await Config.new(argv.dir, argv.conf);
      await config.project.build();
      process.exit(0);
    }
  )
  .command(
    "bundle",
    "Bundle the project's components for publication.",
    (y) => addCommonArgv(y),
    async (argv) => {
      const config = await Config.new(argv.dir, argv.conf);
      const bundlings: Promise<void>[] = [];

      config.project.collections.forEach((collection) => {
        const bundling = collection.exportBundle();
        bundlings.push(bundling);
      });

      await Promise.all(bundlings);

      process.exit(0);
    }
  )
  .command(
    "new",
    "Scaffold a new project, component, or configuration.",
    (y) =>
      addCommonArgv(y)
        .command(
          ["project", "p"],
          "Create a Decal project from scratch.",
          (y) => y,
          async (argv) => {
            const responses = await Project.prompt();
            await Project.make(argv.dir, responses);
            process.exit(0);
          }
        )
        .command(
          ["config", "conf"],
          "Create a Decal configuration file.",
          (y) => y,
          async (argv) => {
            const config = await Config.new(argv.dir, argv.conf);
            await config.write();
            process.exit(0);
          }
        )
        .command(
          ["component", "c"],
          "Create a new Decal component.",
          (y) => y,
          async (argv) => {
            const config = await Config.new(argv.dir, argv.conf);
            await Scaffold.prompt(config.project);
            process.exit(0);
          }
        )
        .demandCommand(1, "")
        .recommendCommands(),
    async (argv) => {
      process.exit(0);
    }
  )
  .demandCommand(1, "")
  .recommendCommands()
  .strict()
  .parse();
