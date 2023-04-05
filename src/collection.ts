import glob from "glob";
import { Config, Scaffold } from "./config.js";
import { Loader } from "./loader.js";

export type Component = {
  name: string;
  dir: string;
  route: string;
};

export type CollectionOptions = {
  loaderIDs?: string[];
  scaffoldIDs?: string[];
};

export class Collection {
  config: Config;
  name: string;
  dir: string;
  loaderIDs: string[];
  scaffoldIDs: string[];

  constructor(config: Config, name: string, options: CollectionOptions = {}) {
    const { loaderIDs: loaders = ["*"], scaffoldIDs: scaffolds = ["*"] } =
      options;

    const { dirs } = config;

    this.config = config;
    this.name = name;
    this.loaderIDs = loaders;
    this.scaffoldIDs = scaffolds;

    this.dir = `${dirs.target}/${name}`;
  }

  get components() {
    return glob
      .sync(`${this.dir}/*`)
      .filter((globDir) => !globDir.includes("node_modules"))
      .map((componentDir) => {
        const componentName = componentDir.replace(/^.+\//, "");
        const componentRoute = `/${this.name}/${componentName}`;
        return {
          name: componentName,
          dir: componentDir,
          route: componentRoute,
        } as Component;
      });
  }

  get scaffolds() {
    if (this.scaffoldIDs.includes("*")) {
      return Array.from(this.config.scaffolds.values());
    } else {
      return this.scaffoldIDs.reduce((bucket, scaffoldId) => {
        const scaffold = this.config.scaffolds.get(scaffoldId);
        if (scaffold) bucket.push(scaffold);
        return bucket;
      }, <Scaffold[]>[]);
    }
  }

  get loaders() {
    if (this.loaderIDs.includes("*")) {
      return Array.from(this.config.loaders.values());
    } else {
      return this.loaderIDs.reduce((bucket, loaderId) => {
        const loader = this.config.loaders.get(loaderId);
        if (loader) bucket.push(loader);
        return bucket;
      }, <Loader[]>[]);
    }
  }
}
