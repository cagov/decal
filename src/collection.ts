import glob from "glob";
import path from "path";
import { Component, ProjectComponent } from "./component.js";
import { Include } from "./include.js";
import { Project } from "./project.js";
import { ScaffoldMode } from "./scaffold.js";
import { NameCase } from "./name-case.js";

export type CollectionOptions = {
  dirName: string;
  component: Component;
  includes?: Include[];
  bundles?: Component[];
};

/**
 * Represents a group of components.
 * Defines how those components should be created, organized, built, and bundled.
 */
export class Collection {
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
    const { component, dirName, includes = [], bundles = [] } = options;

    if (!dirName) {
      throw new Error(`Collection error. No "dirName" specified.`);
    }

    if (!component) {
      throw new Error(`Collection error. No "component" definition specified.`);
    }

    this.dirName = dirName;
    this.component = component;
    this.includes = includes;
    this.bundles = bundles;
  }

  /**
   * Override the original collection's parameters with your own.
   * @param options A *CollectionOptions* object with overrides.
   */
  override(options: Partial<CollectionOptions>) {
    const { dirName, component, includes, bundles } = options;

    const newCollection = new Collection({
      dirName: dirName || this.dirName,
      component: component || this.component,
      includes: includes || this.includes,
      bundles: bundles || this.bundles,
    });

    return newCollection;
  }

  /**
   * The component's name in several different cases.
   * Useful for various scaffolding activities: file naming, variable naming, etc.
   */
  get case() {
    return new NameCase(this.dirName);
  }

  /** The collection's name in plain language. */
  get name() {
    return this.case.sentence;
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
