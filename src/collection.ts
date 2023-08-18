import glob from "glob";
import path from "path";
import { Component, ProjectComponent } from "./component.js";
import { Include } from "./include.js";
import { Project } from "./project.js";
import { ScaffoldMode } from "./scaffold.js";

export type CollectionOptions = {
  name: string;
  dirName?: string;
  component: Component;
  includes?: Include[];
  bundles?: Component[];
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
  component: Component;
  /** A list of *Include* objects that define how this collection loads in development. */
  includes: Include[];
  /** A list of components for bundling this collection. */
  bundles: Component[];

  /**
   * @param options A *CollectionOptions* object to configure this collection.
   */
  constructor(options: CollectionOptions) {
    const { name, component, dirName, includes = [], bundles = [] } = options;

    if (!name) {
      throw new Error(`Collection error. No "name" specified.`);
    }

    if (!component) {
      throw new Error(`Collection error. No "component" definition specified.`);
    }

    this.name = name;
    this.dirName = dirName || name.toLowerCase().replaceAll(" ", "-");

    this.component = component;
    this.includes = includes;
    this.bundles = bundles;
  }

  /**
   * Override the original collection's parameters with your own.
   * @param options A *CollectionOptions* object with overrides.
   */
  override(options: Partial<CollectionOptions>) {
    const { name, dirName, component, includes, bundles } = options;

    const newCollection = new Collection({
      name: name || this.name,
      dirName:
        dirName ||
        (name ? name.toLowerCase().replaceAll(" ", "-") : this.dirName),
      component: component || this.component,
      includes: includes || this.includes,
      bundles: bundles || this.bundles,
    });

    return newCollection;
  }
}

/**
 * *ProjectCollection* is a *Collection* that's "hydrated" by a Decal project.
 * It includes additional methods, including access to the overall *Project* definiton.
 */
export class ProjectCollection extends Collection {
  /** The Decal project to which this collection belongs. */
  project: Project;
  bundles: ProjectComponent[];

  /**
   * @param collection The *Collection* we need to adopt into this project.
   * @param project The overall Decal *Project*.
   */
  constructor(collection: Collection, project: Project) {
    super({
      name: collection.name,
      dirName: collection.dirName,
      component: collection.component,
      includes: collection.includes,
    });

    this.project = project;

    this.bundles = collection.bundles.map((bundle) => {
      const component = new ProjectComponent(
        bundle.dirName,
        bundle,
        this.project,
        this,
        true
      );

      this.project.bundleComponents.push(component);

      return component;
    });
  }

  /** The directory where this collection resides. */
  get dir(): string {
    return path.join(this.project.dir, this.dirName);
  }

  /** The components available to this collection. */
  get components(): ProjectComponent[] {
    return glob
      .sync(`${this.dir}/*`)
      .filter((globDir) => {
        const hasNode = globDir.includes("node_modules");
        return !hasNode;
      })
      .map((componentDir) => {
        const component = new ProjectComponent(
          path.basename(componentDir),
          this.component,
          this.project,
          this
        );
        return component;
      });
  }

  async rebundle() {
    const promises: Promise<void>[] = [];

    this.bundles.forEach((bundle) => {
      const refreshers = bundle.scaffolds.filter(
        (scaffold) => scaffold.mode === ScaffoldMode.Refresh
      );

      refreshers.forEach((scaffold) => {
        const promise = scaffold.refresh(bundle);
        promises.push(promise);
      });
    });

    await Promise.all(promises);
  }
}
