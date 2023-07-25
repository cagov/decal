import glob from "glob";
import { Format } from "./format.js";
import { Scaffold } from "./scaffold.js";
import { Component } from "./component.js";
import { Include } from "./include.js";
import { Bundle } from "./bundle.js";

export type Bundler = (collection: Collection) => void | Promise<void>;

export type CollectionOptions = {
  name: string;
  formats?: Format[];
  scaffolds?: Scaffold[];
  includes?: Include[];
  bundles?: Bundle[];
  dirName?: string;
};

export class Collection {
  name: string;
  dirName: string;
  formats: Format[];
  scaffolds: Scaffold[];
  includes: Include[];
  bundles: Bundle[];
  options: CollectionOptions;
  projectDir: string;

  constructor(options: CollectionOptions) {
    const {
      name = "My Collection",
      formats = [],
      scaffolds = [],
      includes = [],
      bundles = [],
      dirName = "my-collection",
    } = options;

    this.options = options;

    this.name = name;
    this.dirName = dirName;

    this.includes = includes;
    this.bundles = bundles;
    this.formats = formats;

    this.scaffolds = scaffolds.map((scaffold) => {
      scaffold.collection = this;
      return scaffold;
    });

    this.projectDir = process.cwd();
  }

  get dir() {
    return `${this.projectDir}/${this.dirName}`;
  }

  get components() {
    return glob
      .sync(`${this.dir}/*`)
      .filter((globDir) => !globDir.includes("node_modules"))
      .map((componentDir) => {
        const component = new Component(componentDir, this);
        return component;
      });
  }
}
