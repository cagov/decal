import { ProjectCollection } from "./collection.js";
import { Format } from "./format.js";
import { Scaffold } from "./scaffold.js";
import { Include } from "./include.js";
import { Project } from "./project.js";
import path from "path";

export type Bundler = (collection: ProjectCollection) => void | Promise<void>;

export type ComponentOptions = {
  name: string;
  dirName?: string;
  formats?: Format[];
  scaffolds?: Scaffold[];
  includes?: Include[];
};

export class Component {
  /** The descriptive name for this component type. */
  name: string;
  /**
   * The default folder name for this component.
   * This default dirName will only be used when the component is stand-alone.
   * Components within a collection will each have their own unique dirName.
   */
  dirName: string;
  /** A list of *Format* objects that define file formats across the component. */
  formats: Format[];
  /** A list of *Scaffold* objects that define how new components are constructed. */
  scaffolds: Scaffold[];
  /** A list of *Include* objects that define how this component loads in development. */
  includes: Include[];

  constructor(options: ComponentOptions) {
    const {
      name,
      dirName,
      formats = [],
      scaffolds = [],
      includes = [],
    } = options;

    if (!name) {
      throw new Error(`Component error. No "name" specified.`);
    }

    this.name = name;
    this.dirName = dirName || name.toLowerCase().replaceAll(" ", "-");

    this.includes = includes;
    this.formats = formats;
    this.scaffolds = scaffolds;
  }

  /**
   * Override the original component's parameters with your own.
   * @param options A *ComponentOptions* object with overrides.
   */
  override(options: Partial<ComponentOptions>) {
    const { name, formats, scaffolds, includes, dirName } = options;

    const newComponent = new Component({
      name: name || this.name,
      dirName:
        dirName ||
        (name ? name.toLowerCase().replaceAll(" ", "-") : this.dirName),
      formats: formats || this.formats,
      includes: includes || this.includes,
      scaffolds: scaffolds || this.scaffolds,
    });

    return newComponent;
  }
}

/**
 * *ProjectComponent* is a *Component* that's "hydrated" by a Decal project and (optional) collection.
 */
export class ProjectComponent extends Component {
  /** The Decal project to which this component belongs. */
  project: Project;
  /** The Decal collection to which this component belongs. */
  collection?: ProjectCollection;
  /** Determines if this component is a bundle. */
  isBundle: boolean;

  /**
   * @param dirName The assigned folder name for this component.
   * @param component The base *Component* definition.
   * @param project The overall Decal *Project*.
   * @param collection The *ProjectCollection* to which this component belongs, if any.
   * @param isBundle Determines if this component is a bundle. Defaults to false.
   */
  constructor(
    dirName: string,
    component: Component,
    project: Project,
    collection: ProjectCollection | undefined = undefined,
    isBundle: boolean = false
  ) {
    super({
      name: component.name,
      dirName: dirName,
      formats: component.formats,
      includes: component.includes,
      scaffolds: component.scaffolds,
    });

    this.project = project;
    this.collection = collection;
    this.isBundle = isBundle;
  }

  /** The directory where this component resides. */
  get dir(): string {
    return this.isBundle
      ? path.join(this.project.dir, "bundles", this.dirName)
      : this.collection
      ? path.join(this.collection.dir, this.dirName)
      : path.join(this.project.dir, this.dirName);
  }

  /** This component's relative folder path within the project. */
  get slug(): string {
    return this.isBundle
      ? path.join("bundles", this.dirName)
      : this.collection
      ? path.join(this.collection.dirName, this.dirName)
      : this.dirName;
  }

  /** This component's slug with Unix slashes only. Useful on Windows. */
  get posixSlug(): string {
    return this.slug.replace("\\", "/");
  }

  /** The URL path where this component can be accessed in serve mode. */
  get route(): string {
    return `/${this.slug}`;
  }

  /** Other components in the same collection as this component. */
  get siblings(): ProjectComponent[] {
    if (this.collection) {
      return this.collection.components.filter(
        (component) => component.dirName !== this.dirName
      );
    } else {
      return [];
    }
  }

  get children(): ProjectComponent[] {
    return this.isBundle && this.collection ? this.collection.components : [];
  }
}
