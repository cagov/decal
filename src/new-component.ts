import prompts, { PromptObject } from "prompts";
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

  const scaffoldings: Promise<void>[] = [];

  collection.scaffolds.forEach((scaffold) => {
    const scaffolding = Promise.resolve(scaffold.make(name));
    scaffoldings.push(scaffolding);
  });

  await Promise.all(scaffoldings);
};
