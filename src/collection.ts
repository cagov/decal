import glob from "glob";
import { promises as fs } from "fs";

import { Component, ProjectComponent } from "./component.js";
import { Include } from "./include.js";
import { Project } from "./project.js";
import path from "path";

export type CollectionOptions = {
  includes?: Include[];
  dirName?: string;
  bundleDirName?: string;
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
  /** The folder name for this collection's bundles. */
  bundleDirName: string;
  /** The definition for components of this collection. */
  componentDef: Component;
  /** A list of *Include* objects that define how this collection loads in development. */
  includes: Include[];

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
    const { includes = [], dirName, bundleDirName } = options;

    this.name = name;
    this.dirName = dirName || name.toLowerCase().replaceAll(" ", "-");

    this.componentDef = componentDef;

    this.includes = includes;
    this.bundleDirName = bundleDirName || `all-${this.dirName}`;
  }

  /**
   * Override the original collection's parameters with your own.
   * @param options A *CollectionOptions* object with overrides.
   */
  applyOptions(options: CollectionOptions) {
    const { includes, bundleDirName, dirName } = options;

    if (dirName) this.dirName = dirName;
    if (includes) this.includes = includes;
    if (bundleDirName) this.bundleDirName = bundleDirName;
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
    this.bundleDirName = collection.bundleDirName;
  }

  /** The directory where this collection resides. */
  get dir(): string {
    return path.join(this.project.dir, this.dirName);
  }

  get bundleDir(): string {
    return path.join(this.project.dir, "bundles", this.bundleDirName);
  }

  /** The components available to this collection. */
  get components(): ProjectComponent[] {
    return glob
      .sync(`${this.dir}/*`)
      .filter((globDir) => {
        const hasNode = globDir.includes("node_modules");
        const hasBundle = globDir.includes(this.bundleDirName);
        return !(hasNode || hasBundle);
      })
      .map((componentDir) => {
        const component = new ProjectComponent(
          path.basename(componentDir),
          this.componentDef,
          this.project,
          this
        );
        return component;
      });
  }

  get bundle(): ProjectComponent | undefined {
    if (this.componentDef.formats.some((format) => format.canBundle)) {
      const component = new ProjectComponent(
        this.bundleDirName,
        this.componentDef,
        this.project,
        this,
        true
      );
      return component;
    } else {
      return undefined;
    }
  }

  async rebundle() {
    const promises = this.componentDef.formats.map(async (format) => {
      if (format.canBundle) {
        await fs.mkdir(this.bundleDir, { recursive: true });
        const entryPoint = format.entryPoint(this.bundleDirName);
        const contents = await format.bundler(this);
        const filePath = path.join(this.bundleDir, entryPoint);
        await fs.writeFile(filePath, contents);
      }
    });

    await Promise.all(promises);
  }

  async exportBundle() {
    await this.rebundle();

    const promises = this.componentDef.formats.map(async (format) => {
      if (format.canBundle) {
        const entryPoint = format.entryPoint(this.bundleDirName);
        const entryPointPath = `${this.bundleDir}/${entryPoint}`;
        const bundleContents = await fs.readFile(entryPointPath, "utf-8");

        const packContents = await Promise.resolve(
          format.formatter(entryPointPath, bundleContents)
        );

        const packDir = path.join(this.project.dir, "_dist", "bundles");
        await fs.mkdir(packDir, { recursive: true });

        const bundlePoint = format.bundlePoint(this.bundleDirName, this);
        const bundleFilePath = path.join(packDir, bundlePoint);
        await fs.writeFile(bundleFilePath, packContents);
      }
    });

    await Promise.all(promises);
  }
}
