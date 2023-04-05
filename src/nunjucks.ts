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
  (source: string, dir: string, data = {}) => {
    const content = nunjucksEnv.render(source, data);
    const destination = `${dir}/${source.replace(".njk", "")}`;
    return fs.writeFile(destination, content);
  };
