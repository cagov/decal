import prompts, { PromptObject } from "prompts";
import chalk from "chalk";
import { promises as fs } from "fs";
import path from "path";
import url from "url";

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

export const newProject = async () => {
  const responses = await prompts(questions);

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

  const writePackageFile = () => {
    const packageObject = {
      name: org ? `${org}/${module}` : module,
      version,
      description,
      license,
      type: "module",
      scripts: {
        build: "npx decal build",
        serve: "npx decal serve",
        new: "npx decal new",
        init: "npx decal init",
      },
      dependencies: {
        "@cagov/decal": `^${decalPackage.version}`,
      },
    };

    const packageJson = JSON.stringify(packageObject, null, 2);
    const packagePath = `${module}/package.json`;
    return fs.writeFile(packagePath, packageJson);
  };

  await fs.mkdir(module);

  console.log(chalk.green(`Creating project in folder ${module}.`));

  await Promise.all([
    fs.mkdir(`${module}/components`),
    fs.mkdir(`${module}/dist`),
    fs.mkdir(`${module}/test`),
    fs.mkdir(`${module}/demo`),
  ])
    .then(() =>
      Promise.all([
        writePackageFile(),
        fs.writeFile(`${module}/.gitignore`, "dist\nnode_modules\n"),
      ])
    )
    .catch((e) => {
      console.log(e.stack);
      console.log(chalk.bgRed("\nFailed to generate project.\n"));
      throw new Error();
    });

  console.log(chalk.bgGreen(`Project ${module} created.\n`));

  console.log("To begin development, run the following commands.\n");

  console.log(`1. Switch your terminal into the ${module} folder.\n`);
  console.log(`${chalk.bgGray(`cd ${module}`)}\n`);

  console.log("2. Install JavaScript dependencies.\n");
  console.log(`${chalk.bgGray("npm install")}\n`);

  console.log("3. Create your first component.\n");
  console.log(`${chalk.bgGray("npm run new")}\n`);
};
