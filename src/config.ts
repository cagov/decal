import * as path from "path";
import * as url from "url";

import { promises as fs } from "fs";
import { Collection, CollectionOptions } from "./collection.js";
import defaultProjectConfig from "./plugins/default-project.js";

/** Contains directory information relevant to a given run of this tool. */
type Dirs = {
  /** The current working directory of the CLI. */
  current: string;
  /** The targetted directory where this tool should operate, as set by the user. */
  target: string;
  /** The directory of this tool's code. */
  decal: string;
  /** The templates directory. */
  templates: string;
  /**
   * Given an absolute path to a file on the file system,
   * this function returns the relative path against the current directory.
   *
   * This should only be used for reporting. Otherwise, absolute paths should be used in code.
   *
   * @param filePath An absolute path to the file in question.
   * @returns A relative path against the current directory.
   */
  relative: (filePath: string) => string;
};

/**
 * The Config object accepts the user's CLI arguments, examines the environment,
 * and prepares the runtime for requested tasks.
 */
export class Config {
  /** Collections are folders that contain Design System components. */
  collections: Collection[];

  /** Contains directory information relevant to a given run of this tool. */
  dirs: Dirs;

  constructor(dir: string) {
    this.dirs = this.getDirs(dir);
    this.collections = [];
  }

  static async new(dir: string, conf: string) {
    const config = new Config(dir);

    const confFile = conf.startsWith("/")
      ? conf
      : `${config.dirs.target}/${conf}`;

    const configFn = await fs
      .readFile(confFile, "utf-8")
      .then(() => import(confFile))
      .catch(() => defaultProjectConfig);

    if (configFn) configFn.default(config);

    return config;
  }

  private getDirs(dir: string) {
    const current = process.cwd();
    const decal = url
      .fileURLToPath(`${path.dirname(import.meta.url)}/../`)
      .replace(/\/+$/g, "");
    const templates = `${decal}/templates`;
    const target = path.resolve(dir);
    const relative = (filePath: string): string =>
      filePath.replace(`${current}/`, "");

    return {
      current,
      decal,
      templates,
      target,
      relative,
    };
  }

  createCollection(options: CollectionOptions) {
    const collection = new Collection(options);
    collection.projectDir = this.dirs.target;
    this.collections.push(collection);
  }

  applyCollection(collection: Collection, options: Partial<CollectionOptions>) {
    const newOptions = Object.assign(collection.options, options);
    const newCollection = new Collection(newOptions);
    newCollection.projectDir = this.dirs.target;
    this.collections.push(newCollection);
  }

  addPlugin(callback: (decalConfig: Config) => void) {
    callback(this);
  }
}
