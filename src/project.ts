import prompts, { PromptObject, Answers } from "prompts";
import chalk from "chalk";
import * as path from "path";
import * as url from "url";
import { promises as fs } from "fs";
import { ProjectCollection } from "./collection.js";
import { ProjectComponent } from "./component.js";
import { serve } from "./serve/serve.js";

/** Contains directory information relevant to a given run of this tool. */
type Dirs = {
  /** The current working directory of the CLI. */
  current: string;
  /** The targetted directory where this tool should operate, as set by the user. */
  target: string;
  /** The absolute path of the target directory. */
  absTarget: string;
  /** The directory of this tool's code. */
  decal: string;
  /** The templates directory. */
  templates: string;
  /**
   * Given an absolute path to a file on the file system,
   * this function returns the relative path against the current directory.
   *
   * This should only be used for reporting. Otherwise, absolute paths should be used in code.
   *
   * @param filePath An absolute path to the file in question.
   * @returns A relative path against the current directory.
   */
  relative: (filePath: string) => string;
};

const defaultDecalConfigFile = `
import DecalWebComponent from "@cagov/decal/dist/plugins/web-component/web-component.js";
import DecalSass from "@cagov/decal/dist/plugins/sass/sass.js";
import DecalReact from "@cagov/decal/dist/plugins/react/react.js";
import DecalCSS from "@cagov/decal/dist/plugins/css/css.js";

export default (decalConfig) => {
  decalConfig.applyCollection(DecalWebComponent.Collection);
  decalConfig.applyCollection(DecalSass.Collection);
  decalConfig.applyCollection(DecalReact.Collection);
  decalConfig.applyCollection(DecalCSS.Collection);
};
`.trim();

export class Project {
  /** Collections are folders that contain components. */
  collections: ProjectCollection[];
  /** rootComponents are stand-alone component folders. */
  rootComponents: ProjectComponent[];
  /** bundleComponents are special components that combine collections for export.  */
  bundleComponents: ProjectComponent[];

  /** Dirs contains directory information relevant to this project. */
  dirs: Dirs;

  constructor(targetDir: string) {
    this.dirs = this.getDirs(targetDir);
    this.collections = [];
    this.rootComponents = [];
    this.bundleComponents = [];
  }

  private getDirs(dir: string) {
    const current = process.cwd();
    const decal = url
      .fileURLToPath(`${path.dirname(import.meta.url)}/../`)
      .replace(/\/+$/g, "");
    const templates = `${decal}/templates`;
    const target = dir;
    const absTarget = path.resolve(dir);
    const relative = (filePath: string) => path.relative(current, filePath);

    return {
      current,
      decal,
      templates,
      target,
      absTarget,
      relative,
    };
  }

  get dir() {
    return this.dirs.target;
  }

  get absDir() {
    return this.dirs.absTarget;
  }

  get components() {
    const collectionComponents = this.collections.flatMap(
      (collection) => collection.components
    );

    return [
      ...collectionComponents,
      ...this.rootComponents,
      ...this.bundleComponents,
    ];
  }

  async build() {
    const refreshers = this.collections.map((collection) =>
      collection.rebundle()
    );

    await Promise.all(refreshers);

    const builders: Promise<void>[] = [];

    this.components.forEach((component) => {
      component.formats.forEach((format) => {
        const promise = format.buildToFile(component);
        builders.push(promise);
      });
    });

    const buildPath = this.dirs.relative(this.dir);

    console.log("Entering build mode");
    console.log(`Sourcing from ${buildPath || "current folder"}`);
    console.log(`Building to ${path.join(buildPath, "_dist")}\n`);

    await Promise.all(builders);
  }

  static async prompt() {
    const questions: PromptObject<string>[] = [
      {
        type: "text",
        name: "name",
        message: "Project name:",
        initial: "my-component-library",
        format: (str: string) => {
          const name = str.toLowerCase().replace(" ", "-");

          const { 0: module, 1: org } = name.split("/").reverse();

          return {
            module,
            org,
          };
        },
        validate: (str: string) => str.length > 1,
      },
      {
        type: "text",
        name: "version",
        message: "Version:",
        initial: "1.0.0",
      },
      {
        type: "text",
        name: "description",
        message: "Description:",
        initial: "My component library.",
      },
      {
        type: "text",
        name: "license",
        message: "License:",
        initial: "MIT",
      },
    ];

    const responses = await prompts(questions);
    return responses;
  }

  static async make(dir: string, responses: Answers<string>) {
    // Need a line break.
    console.log("");

    const decalPkgFilePath = url.fileURLToPath(
      `${path.dirname(import.meta.url)}/../package.json`
    );

    const decalPackage = await fs
      .readFile(decalPkgFilePath, "utf-8")
      .then((json) => JSON.parse(json));

    const {
      name: { module, org },
      version,
      description,
      license,
    } = responses;

    const dirPath = dir ? `${dir}/${module}` : module;

    const writePackageFile = () => {
      const packageObject = {
        name: org ? `${org}/${module}` : module,
        version,
        description,
        license,
        type: "module",
        scripts: {
          build: "decal build",
          serve: "decal serve",
          new: "decal new component",
        },
        dependencies: {
          "@cagov/decal": `^${decalPackage.version}`,
        },
      };

      const packageJson = JSON.stringify(packageObject, null, 2);
      const packagePath = `${dirPath}/package.json`;
      return fs.writeFile(packagePath, packageJson);
    };

    await fs.mkdir(dirPath);

    console.log(chalk.green(`Creating project in folder ${dirPath}.`));

    await Promise.all([fs.mkdir(`${dirPath}/_dist`)])
      .then(() =>
        Promise.all([
          writePackageFile(),
          fs.writeFile(`${dirPath}/.gitignore`, "_dist\nnode_modules\n"),
          fs.writeFile(`${dirPath}/decal.config.js`, defaultDecalConfigFile),
        ])
      )
      .catch((e) => {
        console.log(e.stack);
        console.log(chalk.bgRed("\nFailed to generate project.\n"));
        throw new Error();
      });

    console.log(chalk.bgGreen(`Project ${module} created.\n`));

    console.log("To begin development, run the following commands.\n");

    console.log(`1. Switch your terminal into the ${dirPath} folder.\n`);
    console.log(`${chalk.bgGray(`cd ${dirPath}`)}\n`);

    console.log("2. Install JavaScript dependencies.\n");
    console.log(`${chalk.bgGray("npm install")}\n`);

    console.log("3. Create your first component.\n");
    console.log(`${chalk.bgGray("npm run new")}\n`);

    console.log("4. Serve your component and start coding!\n");
    console.log(`${chalk.bgGray("npm run serve")}\n`);
  }

  serve(port: number = 3000) {
    serve(this, port);
  }
}
