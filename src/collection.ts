import glob from "glob";
import { Format } from "./format.js";
import { Scaffold } from "./scaffold.js";
import { Component } from "./component.js";
import { Include } from "./include.js";
import { Bundle } from "./bundle.js";
import { Project } from "./project.js";

export type CollectionOptions = {
  formats?: Format[];
  scaffolds?: Scaffold[];
  includes?: Include[];
  bundles?: Bundle[];
  dirName?: string;
};

/**
 * Represents a group of components.
 * Defines how those components should be created, organized, built, and bundled.
 */
export class Collection {
  /** The descriptive name for this collection. */
  name: string;
  /** The folder name for this collection within the project. */
  dirName: string;
  /** A list of *Format* objects that define file formats across the collection. */
  formats: Format[];
  /** A list of *Scaffold* objects that define how new components are constructed. */
  scaffolds: Scaffold[];
  /** A list of *Include* objects that define how this collection loads in development. */
  includes: Include[];
  /** A list of *Bundle* objects that define how this collection is packaged for publication. */
  bundles: Bundle[];

  constructor(name = "My Collection", options: CollectionOptions = {}) {
    const {
      formats = [],
      scaffolds = [],
      includes = [],
      bundles = [],
      dirName,
    } = options;

    this.name = name;
    this.dirName = dirName || name.toLowerCase().replaceAll(" ", "-");

    this.includes = includes;
    this.bundles = bundles;
    this.formats = formats;
    this.scaffolds = scaffolds;
  }

  /**
   * Override the original collection's parameters with your own.
   * @param options A *CollectionOptions* object with overrides.
   */
  applyOptions(options: CollectionOptions) {
    const { formats, scaffolds, includes, bundles, dirName } = options;

    if (dirName) this.dirName = dirName;
    if (formats) this.formats = formats;
    if (includes) this.includes = includes;
    if (bundles) this.bundles = bundles;
    if (scaffolds) this.scaffolds = scaffolds;
  }
}

/**
 * *CollectionEx* is a *Collection* that's "hydrated" by a Decal project.
 * It includes additional methods, including access to the overall *Project* definiton.
 */
export class ProjectCollection extends Collection {
  /** The Decal project to which this collection belongs. */
  project: Project;

  constructor(name: string, collection: Collection, project: Project) {
    super(name);

    this.project = project;
    this.dirName = collection.dirName;

    this.includes = collection.includes;
    this.bundles = collection.bundles;
    this.formats = collection.formats;
    this.scaffolds = collection.scaffolds;
  }

  /** The directory where this collection resides. */
  get dir() {
    return `${this.project.dir}/${this.dirName}`;
  }

  /** The components available to this collection. */
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
