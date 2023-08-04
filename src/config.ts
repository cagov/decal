import { promises as fs } from "fs";
import {
  Collection,
  ProjectCollection,
  CollectionOptions,
} from "./collection.js";
import { Project } from "./project.js";
import defaultProjectConfig from "./plugins/default-project.js";
import { Component } from "./component.js";

/**
 * *Config* collects each Decal project's configuration files and processes them.
 */
export class Config {
  /** The overall Decal *Project* as defined by configuration. */
  project: Project;

  /**
   * @param dir The directory that contains your Decal project.
   */
  constructor(dir: string) {
    this.project = new Project(dir);
  }

  /**
   * *Config.new* allows us to create a new instance while using async/await.
   * Use this instead of the typical *let config = new Config(...)* JS syntax.
   * @param dir The directory that contains your Decal project.
   * @param conf The path to your decal.config.js file.
   * @returns A Promise for a complete *Config* object.
   */
  static async new(dir: string, conf: string): Promise<Config> {
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

  /**
   * Create a new *Collection* and add it to this Decal project.
   * @param name The name of your new collection.
   * @param componentDef A *Component* object that defines components for this collection.
   * @param options A *CollectionOptions* object to configure your new collection.
   */
  createCollection(
    name: string,
    componentDef: Component,
    options: CollectionOptions
  ) {
    const collection = new Collection(name, componentDef, options);
    const collectionEx = new ProjectCollection(collection, this.project);
    this.project.collections.push(collectionEx);
  }

  /**
   * Import an existing *Collection* into this Decal project.
   * This is useful when importing a Collection definition from NPM or another file.
   * @param collection The *Collection* object you wish to import.
   * @param options A partial *CollectionOptions* object with any properties you wish to override on the imported collection.
   */
  applyCollection(collection: Collection, options: Partial<CollectionOptions>) {
    collection.applyOptions(options);
    const collectionEx = new ProjectCollection(collection, this.project);
    this.project.collections.push(collectionEx);
  }

  /**
   * Imports another Decal configuration into this project.
   * @param callback Your imported Decal configuration function, taking the form of *(decalConfig) => {}*.
   */
  addPlugin(callback: (decalConfig: Config) => void) {
    callback(this);
  }

  /**
   * Write a new Decal configuration file, *decal.config.js*, to the project root folder.
   */
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
