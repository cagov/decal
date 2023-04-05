import { promises as fs } from "fs";
import { Config } from "./config.js";

export const newConfig = async (config: Config) => {
  const { dirs } = config;

  const configFilePath = `${dirs.target}/decal.config.js`;

  const existingFile = await fs
    .readFile(configFilePath, "utf-8")
    .catch(() => undefined);

  if (existingFile) {
    console.log("Config file already exists.");
    console.log(configFilePath);
    console.log("Consider renaming this file if you want to start fresh.");
    return;
  }

  const defaultConfigFile = await fs.readFile(
    `${dirs.templates}/init/default.decal.config.js`,
    "utf-8"
  );

  await fs.writeFile(configFilePath, defaultConfigFile);

  console.log("Config file initialized.");
  console.log(configFilePath);
};
