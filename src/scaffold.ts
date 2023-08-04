import { ProjectCollection } from "./collection.js";
import prompts, { PromptObject } from "prompts";
import { promises as fs } from "fs";
import { Project } from "./project.js";
import { ProjectComponent } from "./component.js";

export type ScaffoldNames = {
  plainCase: string;
  camelCase: string;
  kebabCase: string;
  snakeCase: string;
};

export type Scaffolder = (
  component: ProjectComponent,
  names: ScaffoldNames
) => void;

export type ScaffoldDirNamer = (names: ScaffoldNames) => string;

export type ScaffoldOptions = {
  name?: string;
  dirNamer?: ScaffoldDirNamer;
  scaffolder: Scaffolder;
};

const defaultDirname: ScaffoldDirNamer = (names) => names.kebabCase;

export class Scaffold {
  name: string;
  dirNamer: ScaffoldDirNamer;
  scaffolder: Scaffolder;

  constructor(name: string, options: ScaffoldOptions) {
    const { dirNamer = defaultDirname, scaffolder } = options;

    this.name = name;
    this.dirNamer = dirNamer;
    this.scaffolder = scaffolder;
  }

  async buildIntoCollection(name: string, collection: ProjectCollection) {
    const nameCases = Scaffold.getNameCases(name);
    const dirName = this.dirNamer(nameCases);

    const component = new ProjectComponent(
      dirName,
      collection.componentDef,
      collection.project,
      collection
    );

    await fs.mkdir(component.dir, { recursive: true });

    const scaffolding = Promise.resolve(this.scaffolder(component, nameCases));

    return scaffolding;
  }

  static getNameCases(componentName: string) {
    const kebabCase = componentName.toLowerCase().replaceAll(" ", "-");
    const snakeCase = componentName.toLowerCase().replaceAll(" ", "_");
    const camelCase = componentName
      .split(" ")
      .map((word: string) => `${word[0].toUpperCase()}${word.substring(1)}`)
      .join("");

    return {
      plainCase: componentName,
      kebabCase,
      camelCase,
      snakeCase,
    };
  }

  static async prompt(project: Project) {
    const { collections } = project;

    const questions: PromptObject<string>[] = [
      {
        type: "text",
        name: "name",
        message: "What's the name of your new component?",
        format: (str: string) => str.replace(/[^A-Za-z0-9\s]/g, ""),
        validate: (str: string) => str.length > 1,
      },
      {
        type: () => (collections.length > 1 ? "select" : null),
        name: "collection",
        message: "In which collection would you like to creote this component?",
        initial: 0,
        choices: collections.map((collection) => ({
          title: collection.name,
          value: collection,
        })),
      },
      {
        type: (prev: ProjectCollection) =>
          prev && prev.componentDef.scaffolds.length > 1 ? "select" : null,
        name: "scaffold",
        message: "Which scaffold would you like to use?",
        initial: 0,
        choices: (prev: ProjectCollection) =>
          prev.componentDef.scaffolds.map((scaffold: Scaffold) => ({
            title: scaffold.name,
            value: scaffold,
          })),
      },
    ];

    const responses = await prompts(questions);

    const newComponentName = responses.name;
    const collection = responses.collection || collections[0];
    const scaffold = responses.scaffold || collection.componentDef.scaffolds[0];

    if (newComponentName && scaffold) {
      await scaffold.buildIntoCollection(newComponentName, collection);
    }
  }
}
