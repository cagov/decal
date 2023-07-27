import { promises as fs } from "fs";
import nunjucks, { Environment } from "nunjucks";

export const getEnvironment = (templatesDir: string) => {
  const nunjucksFileLoader = new nunjucks.FileSystemLoader(templatesDir);
  const nunjucksEnv = new nunjucks.Environment(nunjucksFileLoader, {
    autoescape: false,
  });
  return nunjucksEnv;
};

export const getRenderer =
  (nunjucksEnv: Environment) =>
  (source: string, destination: string, data = {}) => {
    const content = nunjucksEnv.render(source, data);
    return fs.writeFile(destination, content);
  };
