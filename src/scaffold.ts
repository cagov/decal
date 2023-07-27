import { Collection } from "./collection.js";
import prompts, { PromptObject } from "prompts";
import { promises as fs } from "fs";
import { Config } from "./config.js";

export type ScaffoldNames = {
  plainCase: string;
  camelCase: string;
  kebabCase: string;
  snakeCase: string;
};

export type Scaffolder = (
  dir: string,
  names: ScaffoldNames,
  collection: Collection
) => void;

export type ScaffoldDirNamer = (names: ScaffoldNames) => string;

export type ScaffoldOptions = {
  name: string;
  dirNamer?: ScaffoldDirNamer;
  scaffolder: Scaffolder;
};

const defaultDirname: ScaffoldDirNamer = (names) => names.kebabCase;

export class Scaffold {
  name: string;
  dirNamer: ScaffoldDirNamer;
  scaffolder: Scaffolder;
  collection: Collection;

  constructor(options: ScaffoldOptions) {
    const { name, dirNamer = defaultDirname, scaffolder } = options;

    this.name = name;
    this.dirNamer = dirNamer;
    this.scaffolder = scaffolder;

    this.collection = new Collection({ name: "Default" });
  }

  async make(newComponentName: string) {
    const kebabCase = newComponentName.toLowerCase().replaceAll(" ", "-");
    const snakeCase = newComponentName.toLowerCase().replaceAll(" ", "_");
    const camelCase = newComponentName
      .split(" ")
      .map((word: string) => `${word[0].toUpperCase()}${word.substring(1)}`)
      .join("");

    const names = {
      plainCase: newComponentName,
      kebabCase,
      camelCase,
      snakeCase,
    };

    const dirName = this.dirNamer(names);
    const dirPath = `${this.collection.dir}/${dirName}`;

    await fs.mkdir(dirPath, { recursive: true });

    const scaffolding = Promise.resolve(
      this.scaffolder(dirPath, names, this.collection)
    );

    return scaffolding;
  }

  static async prompt(config: Config) {
    const { collections } = config;

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
        type: (prev) => (prev && prev.scaffolds.length > 1 ? "select" : null),
        name: "scaffold",
        message: "Which scaffold would you like to use?",
        initial: 0,
        choices: (prev) =>
          prev.scaffolds.map((scaffold: Scaffold) => ({
            title: scaffold.name,
            value: scaffold,
          })),
      },
    ];

    const responses = await prompts(questions);

    const newComponentName = responses.name;
    const collection = responses.collection || collections[0];
    const scaffold = responses.scaffold || collection.scaffolds[0];

    if (newComponentName && scaffold) await scaffold.make(newComponentName);
  }
}
