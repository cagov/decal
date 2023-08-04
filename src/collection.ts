import glob from "glob";
import { Component, ProjectComponent } from "./component.js";
import { Include } from "./include.js";
import { Bundle } from "./bundle.js";
import { Project } from "./project.js";

export type CollectionOptions = {
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
  /** The definition for components of this collection. */
  componentDef: Component;
  /** A list of *Include* objects that define how this collection loads in development. */
  includes: Include[];
  /** A list of *Bundle* objects that define how this collection is packaged for publication. */
  bundles: Bundle[];

  /**
   * @param name The descriptive name for this collection.
   * @param componentDef The definition for components of this collection.
   * @param options A *CollectionOptions* object to configure this collection.
   */
  constructor(
    name: string,
    componentDef: Component,
    options: CollectionOptions = {}
  ) {
    const { includes = [], bundles = [], dirName } = options;

    this.name = name;
    this.dirName = dirName || name.toLowerCase().replaceAll(" ", "-");

    this.componentDef = componentDef;

    this.includes = includes;
    this.bundles = bundles;
  }

  /**
   * Override the original collection's parameters with your own.
   * @param options A *CollectionOptions* object with overrides.
   */
  applyOptions(options: CollectionOptions) {
    const { includes, bundles, dirName } = options;

    if (dirName) this.dirName = dirName;
    if (includes) this.includes = includes;
    if (bundles) this.bundles = bundles;
  }
}

/**
 * *ProjectCollection* is a *Collection* that's "hydrated" by a Decal project.
 * It includes additional methods, including access to the overall *Project* definiton.
 */
export class ProjectCollection extends Collection {
  /** The Decal project to which this collection belongs. */
  project: Project;

  /**
   * @param name The descriptive name for this collection.
   * @param collection The *Collection* we need to adopt into this project.
   * @param project The overall Decal *Project*.
   */
  constructor(collection: Collection, project: Project) {
    super(collection.name, collection.componentDef);

    this.project = project;
    this.dirName = collection.dirName;
    this.includes = collection.includes;
    this.bundles = collection.bundles;
  }

  /** The directory where this collection resides. */
  get dir(): string {
    return `${this.project.dir}/${this.dirName}`;
  }

  /** The components available to this collection. */
  get components(): ProjectComponent[] {
    return glob
      .sync(`${this.dir}/*`)
      .filter((globDir) => !globDir.includes("node_modules"))
      .map((componentDir) => {
        const component = new ProjectComponent(
          componentDir.replace(`${this.dir}/`, ""),
          this.componentDef,
          this.project,
          this
        );
        return component;
      });
  }
}
