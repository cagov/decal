import { Collection } from "./collection.js";
import { promises as fs } from "fs";

export type ScaffoldNames = {
  plainCase: string;
  camelCase: string;
  kebabCase: string;
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

  async make(name: string) {
    const kebabCase = name.toLowerCase().replaceAll(" ", "-");
    const camelCase = name
      .split(" ")
      .map((word: string) => `${word[0].toUpperCase()}${word.substring(1)}`)
      .join("");

    const names = {
      plainCase: name,
      kebabCase,
      camelCase,
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
}
