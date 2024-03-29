import { ProjectCollection } from "./collection.js";
import prompts, { PromptObject } from "prompts";
import { promises as fs } from "fs";
import { Project } from "./project.js";
import { ProjectComponent } from "./component.js";
import { NameCase } from "./name-case.js";
import chalk from "chalk";

export type Scaffolder = (component: ProjectComponent) => void;

export type ScaffoldDirNamer = (nameCase: NameCase) => string;

export const ScaffoldMode = {
  New: "new",
  Refresh: "refresh",
};

export type ScaffoldOptions = {
  name: string;
  scaffolder: Scaffolder;
  dirNamer?: ScaffoldDirNamer;
  mode?: string;
};

const defaultDirname: ScaffoldDirNamer = (nameCase) => nameCase.param;

export class Scaffold {
  name: string;
  scaffolder: Scaffolder;
  dirNamer: ScaffoldDirNamer;
  mode: string;

  constructor(options: ScaffoldOptions) {
    const {
      name,
      scaffolder,
      dirNamer = defaultDirname,
      mode = ScaffoldMode.New,
    } = options;

    if (!name) {
      throw new Error(`Scaffold error. No "name" specified.`);
    }

    if (!scaffolder) {
      throw new Error(`Scaffold error. No "scaffolder" specified.`);
    }

    this.name = name;
    this.scaffolder = scaffolder;
    this.dirNamer = dirNamer;
    this.mode = mode;
  }

  async runScaffolder(component: ProjectComponent) {
    await fs.mkdir(component.dir, { recursive: true });

    await Promise.resolve(this.scaffolder(component)).catch((e) => {
      console.log(
        chalk.bgRed(
          `\nError running scaffold ${this.name} at ${component.slug}.\n`,
          e
        )
      );
    });
  }

  async create(component: ProjectComponent, prompted: boolean = false) {
    if (this.mode === ScaffoldMode.New) {
      return fs
        .access(component.dir)
        .then(() => {
          // Component already exists.
          if (prompted) {
            console.log(
              chalk.bgRed(
                `\n${component.name} at ${component.dir} already exists.\n`
              )
            );
          }
        })
        .catch(async () => {
          // Component doesn't exist, create it.
          await this.runScaffolder(component);

          console.log(
            chalk.bgGreen(`\n${component.name} created in ${component.dir}.\n`)
          );

          if (prompted) {
            console.log(
              "To work on this new component, start up serve mode.\n"
            );
            console.log(chalk.bgGray("npm run serve\n"));

            console.log("Then start editing the files here.\n");
            console.log(chalk.bgGray(`${component.dir}\n`));
          }
        });
    } else {
      console.log(
        chalk.bgYellow(
          `\nTried to create new component with scaffold ${this.name} at ${component.slug}.`,
          `However, this scaffold's mode is set to *${this.mode}*.\n`
        )
      );
    }
  }

  async refresh(component: ProjectComponent) {
    if (this.mode === ScaffoldMode.Refresh) {
      await this.runScaffolder(component);

      /*
      console.log(
        chalk.bgGreen(
          `\n${component.slug} refreshed by scaffold ${this.name}.\n`
        )
      );
      */
    } else {
      console.log(
        chalk.bgYellow(
          `\nTried to refresh component with scaffold ${this.name} at ${component.slug}.`,
          `However, this scaffold's mode is set to *${this.mode}*.\n`
        )
      );
    }
  }

  async createForCollection(name: string, collection: ProjectCollection) {
    const dirName = this.dirNamer(new NameCase(name));

    const componentEx = new ProjectComponent(
      dirName,
      collection.component,
      collection.project,
      collection
    );

    return this.create(componentEx, true).then(async () => {
      await collection.rebundle();
    });
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
          prev !== undefined && prev.component.scaffolds.length > 1
            ? "select"
            : null,
        name: "scaffold",
        message: "Which scaffold would you like to use?",
        initial: 0,
        choices: (prev: ProjectCollection) =>
          prev.component.scaffolds.map((scaffold: Scaffold) => ({
            title: scaffold.name,
            value: scaffold,
          })),
      },
    ];

    const responses = await prompts(questions);

    const newComponentName = responses.name;
    const collection: ProjectCollection =
      responses.collection || collections[0];
    const scaffold: Scaffold =
      responses.scaffold || collection.component.scaffolds[0];

    if (newComponentName && scaffold) {
      await scaffold.createForCollection(newComponentName, collection);
    } else {
      console.log(
        chalk.bgRed(
          `\nUnable to create new component, ${newComponentName}.\n`,
          `Scaffold not found.\n`,
          `Check your configuration for the ${collection.name} collection.\n`
        )
      );
    }
  }
}
