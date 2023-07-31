import { promises as fs } from "fs";
import {
  Collection,
  ProjectCollection,
  CollectionOptions,
} from "./collection.js";
import { Project } from "./project.js";
import defaultProjectConfig from "./plugins/default-project.js";

/**
 * The Config object accepts the user's CLI arguments, examines the environment,
 * and prepares the runtime for requested tasks.
 */
export class Config {
  project: Project;

  constructor(dir: string) {
    this.project = new Project(dir);
  }

  static async new(dir: string, conf: string) {
    const config = new Config(dir);

    const confFile = conf.startsWith("/")
      ? conf
      : `${config.project.dir}/${conf}`;

    const configFn = await fs
      .readFile(confFile, "utf-8")
      .then(() => import(confFile))
      .catch(() => defaultProjectConfig);

    if (configFn) configFn.default(config);

    return config;
  }

  createCollection(name: string, options: CollectionOptions) {
    const collection = new Collection(name, options);
    const collectionEx = new ProjectCollection(name, collection, this.project);
    this.project.collections.push(collectionEx);
  }

  applyCollection(collection: Collection, options: Partial<CollectionOptions>) {
    collection.applyOptions(options);
    const collectionEx = new ProjectCollection(
      collection.name,
      collection,
      this.project
    );
    this.project.collections.push(collectionEx);
  }

  addPlugin(callback: (decalConfig: Config) => void) {
    callback(this);
  }

  async write() {
    const configFilePath = `${this.project.dir}/decal.config.js`;

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
      `${this.project.dirs.templates}/init/default.decal.config.js`,
      "utf-8"
    );

    await fs.writeFile(configFilePath, defaultConfigFile);

    console.log("Config file initialized.");
    console.log(configFilePath);
  }
}
