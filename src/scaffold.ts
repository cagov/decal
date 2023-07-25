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

export type ScaffoldPromptResponse = {
  newComponentName: string;
  collection: Collection;
};

export type Scaffolder = (
  dir: string,
  names: ScaffoldNames,
  collection: Collection
) => void;

export type ScaffoldDirNamer = (names: ScaffoldNames) => string;

export type ScaffoldOptions = {
  dirNamer?: ScaffoldDirNamer;
  scaffolder: Scaffolder;
};

const defaultDirname: ScaffoldDirNamer = (names) => names.kebabCase;

export class Scaffold {
  dirNamer: ScaffoldDirNamer;
  scaffolder: Scaffolder;
  collection: Collection;

  constructor(options: ScaffoldOptions) {
    const { dirNamer = defaultDirname, scaffolder } = options;

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

    const workDirs = ["src", "demo"];

    await fs
      .mkdir(dirPath, { recursive: true })
      .then(() =>
        Promise.all(
          workDirs.map((workDir) =>
            fs.mkdir(`${dirPath}/${workDir}`).catch((err) => {
              if (err.code != "EEXIST") throw err;
            })
          )
        )
      )
      .catch((err) => {
        if (err.code != "EEXIST") throw err;
      });

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
    ];

    const hasManyCollections = collections.length > 1;

    if (hasManyCollections) {
      const collectionChoices = collections.map((collection) => ({
        title: collection.name,
        value: collection,
      }));

      questions.unshift({
        type: "select",
        name: "collection",
        message: "In which collection would you like to creote this component?",
        choices: collectionChoices,
      });
    }

    const responses = await prompts(questions);

    const collection = hasManyCollections
      ? responses.collection
      : collections[0];

    const newComponentName = responses.name;

    return {
      newComponentName,
      collection,
    } as ScaffoldPromptResponse;
  }

  static async makeAll(newComponentName: string, scaffolds: Scaffold[]) {
    const scaffoldings: Promise<void>[] = [];

    scaffolds.forEach((scaffold) => {
      const scaffolding = Promise.resolve(scaffold.make(newComponentName));
      scaffoldings.push(scaffolding);
    });

    await Promise.all(scaffoldings);
  }
}
