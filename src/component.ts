import { ProjectCollection } from "./collection.js";
import { Format } from "./format.js";
import { Scaffold } from "./scaffold.js";
import { Include } from "./include.js";
import { Project } from "./project.js";

export type Bundler = (collection: ProjectCollection) => void | Promise<void>;

export type ComponentOptions = {
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

  constructor(name: string, options: ComponentOptions = {}) {
    const { dirName, formats = [], scaffolds = [], includes = [] } = options;

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
  override(options: ComponentOptions) {
    const { formats, scaffolds, includes, dirName } = options;

    if (dirName) this.dirName = dirName;
    if (formats) this.formats = formats;
    if (includes) this.includes = includes;
    if (scaffolds) this.scaffolds = scaffolds;
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

  /**
   * @param dirName The assigned folder name for this component.
   * @param component The base *Component* definition.
   * @param project The overall Decal *Project*.
   * @param collection The *ProjectCollection* to which this component belongs, if any.
   */
  constructor(
    dirName: string,
    component: Component,
    project: Project,
    collection: ProjectCollection | undefined = undefined
  ) {
    super(component.name);

    this.project = project;
    this.collection = collection;

    this.dirName = dirName;
    this.includes = component.includes;
    this.formats = component.formats;
    this.scaffolds = component.scaffolds;
  }

  /** The directory where this component resides. */
  get dir(): string {
    return this.collection
      ? `${this.collection.dir}/${this.dirName}`
      : `${this.project.dir}/${this.dirName}`;
  }

  /** This component's relative folder path within the project. */
  get slug(): string {
    return this.collection
      ? `${this.collection.dirName}/${this.dirName}`
      : this.dirName;
  }

  /** The URL path where this component can be accessed in serve mode. */
  get route(): string {
    return `/${this.slug}`;
  }
}
