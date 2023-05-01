import yargs, { Argv } from "yargs";
import { hideBin } from "yargs/helpers";

import { Config } from "./config.js";
import { serve } from "./serve.js";
import { build } from "./build.js";
import { newProject } from "./new-project.js";
import { newConfig } from "./new-config.js";
import { newComponent } from "./new-component.js";

/**
 * Adds common CLI-option configurations to any yargs CLI command.
 * @param y The yargs.Argv configuration object.
 * @returns A new yargs.Argv configuration object with our additions.
 */
const addCommonArgv = (y: Argv) => {
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
};

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
      const config = await Config.new(argv);
      serve(config);
    }
  )
  .command(
    "build",
    "Build the project's components for publication.",
    (y) => addCommonArgv(y),
    async (argv) => {
      const config = await Config.new(argv);
      await build(config);
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
            await newProject();
            process.exit(0);
          }
        )
        .command(
          ["config", "conf"],
          "Create a Decal configuration file.",
          (y) => y,
          async (argv) => {
            const config = await Config.new(argv);
            await newConfig(config);
            process.exit(0);
          }
        )
        .command(
          ["component", "c"],
          "Create a new Decal component.",
          (y) => y,
          async (argv) => {
            const config = await Config.new(argv);
            await newComponent(config);
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
