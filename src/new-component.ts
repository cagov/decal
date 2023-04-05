import prompts, { PromptObject } from "prompts";
import { promises as fs } from "fs";
import { Config } from "./config.js";
import { Collection } from "./collection.js";

export const newComponent = async (config: Config) => {
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

  const collection: Collection = hasManyCollections
    ? responses.collection
    : collections[0];

  const name = responses.name;
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

  const dir = `${collection.dir}/${kebabCase}`;

  await fs
    .mkdir(dir)
    .then(() =>
      Promise.all([fs.mkdir(`${dir}/src`), fs.mkdir(`${dir}/examples`)])
    );

  const scaffoldings: Promise<void>[] = [];

  collection.scaffolds.forEach((scaffold) => {
    const scaffolding = Promise.resolve(scaffold(dir, names, collection));
    scaffoldings.push(scaffolding);
  });

  await Promise.all(scaffoldings);
};
