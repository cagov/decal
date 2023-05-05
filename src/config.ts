import * as path from "path";
import * as url from "url";
import { promises as fs } from "fs";
import { Arguments } from "yargs";
import { Collection, CollectionOptions } from "./collection.js";
import { Loader, LoaderOptions } from "./loader.js";
import { Include, IncludeTag } from "./include.js";
import defaultProjectConfig from "./plugins/default-project.js";

/** Supplements the yargs.Arguments type with our expected additions. */
export type CommonArguments = Arguments<{
  dir: string;
  conf: string;
}>;

export type Processor = (filePath: string, contents: string) => string;

export type Scaffold = (
  dir: string,
  names: {
    plainCase: string;
    camelCase: string;
    kebabCase: string;
  },
  collection: Collection
) => void;

/**
 * The Config object accepts the user's CLI arguments, examines the environment,
 * and prepares the runtime for requested tasks.
 */
export class Config {
  /** The usage mode requested by the user: serve, build, etc. */
  command: string;

  /** Contains directory information relevant to a given run of this tool. */
  dirs: {
    /** The current working directory of the CLI. */
    current: string;

    /** The targetted directory where this tool should operate, as set by the user. */
    target: string;

    /** The directory of this tool's code. */
    decal: string;

    /** The templates directory. */
    templates: string;

    /** The sub-directory with code for this tool's requested mode. */
    command: string;

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

  /** Collections are folders that contain Design System components. */
  collections: Collection[];

  /** Loaders define how different file types should be processed. */
  loaders: Map<string, Loader>;

  /** Includes help serve mode include assets for preview. */
  includes: Map<string, Include>;

  /** Processors transform or transport files from one format to another. */
  processors: Map<string, Processor>;

  /** Scaffolds help kick-start new components by pre-rendering example files. */
  scaffolds: Map<string, Scaffold>;

  /** The port to be used by the "serve" mode's dev server.  */
  port?: number;

  constructor(argv: CommonArguments) {
    this.command = argv._[0] as string;
    this.dirs = this.getDirs(argv);

    this.collections = [];
    this.loaders = new Map();
    this.includes = new Map();
    this.processors = new Map();
    this.scaffolds = new Map();

    if (argv.port) this.port = argv.port as number;
  }

  static async new(argv: CommonArguments) {
    const config = new Config(argv);

    config.addPlugin(defaultProjectConfig);

    const confFile = argv.conf.startsWith("/")
      ? argv.conf
      : `${config.dirs.target}/${argv.conf}`;

    const configFn = await fs
      .readFile(confFile, "utf-8")
      .then(() => import(confFile))
      .catch(() => undefined);

    if (configFn) configFn.default(config);

    config.finish();

    return config;
  }

  private getDirs(argv: CommonArguments) {
    const current = process.cwd();
    const decal = url
      .fileURLToPath(`${path.dirname(import.meta.url)}/../`)
      .replace(/\/+$/g, "");
    const templates = `${decal}/templates`;
    const command = `${decal}/src/${this.command}`;
    const target = path.resolve(argv.dir);
    const relative = (filePath: string): string =>
      filePath.replace(`${current}/`, "");

    return {
      current,
      decal,
      templates,
      command,
      target,
      relative,
    };
  }

  addCollection(name: string, options: CollectionOptions = {}) {
    const collection = new Collection(this, name, options);
    this.collections.push(collection);
  }

  addLoader(id: string, options: LoaderOptions) {
    const loader = Loader.new(this, id, options);
    if (loader) this.loaders.set(id, loader);
  }

  addInclude(id: string, includeTag: IncludeTag) {
    const include = new Include(this, id, includeTag);
    this.includes.set(id, include);
  }

  addScaffold(id: string, scaffold: Scaffold) {
    this.scaffolds.set(id, scaffold);
  }

  addProcessor(id: string, processor: Processor) {
    this.processors.set(id, processor);
  }

  addPlugin(callback: (decalConfig: Config) => void) {
    callback(this);
  }

  private finish() {
    if (!this.collections.length) this.addCollection("components");
  }
}
