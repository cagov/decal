import glob from "glob";
import { Format, IncludeTag } from "./format.js";
import { Scaffold } from "./scaffold.js";

export type Bundler = (collection: Collection) => void | Promise<void>;

export type Component = {
  name: string;
  dir: string;
  route: string;
  slug: string;
};

export type CollectionOptions = {
  name: string;
  formats?: Format[];
  scaffolds?: Scaffold[];
  includeTags?: IncludeTag[];
  bundles?: Bundler[];
  dirName?: string;
};

export class Collection {
  name: string;
  dirName: string;
  formats: Format[];
  scaffolds: Scaffold[];
  includeTags: IncludeTag[];
  bundles: Bundler[];
  options: CollectionOptions;
  projectDir: string;

  constructor(options: CollectionOptions) {
    const {
      name = "My Collection",
      formats = [],
      scaffolds = [],
      includeTags = [],
      bundles = [],
      dirName = "my-collection",
    } = options;

    this.options = options;

    this.name = name;
    this.dirName = dirName;

    this.includeTags = includeTags;
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
        const componentName = componentDir.replace(/^.+\//, "");
        const componentSlug = `${this.dirName}/${componentName}`;
        const componentRoute = `/${componentSlug}`;
        return {
          name: componentName,
          slug: componentSlug,
          dir: componentDir,
          route: componentRoute,
        } as Component;
      });
  }
}
