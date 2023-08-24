import { NameCase } from "./name-case.js";

export type Includer = (input: string) => string;

export type IncludeOptions = {
  name: string;
  id?: string;
  mode?: string;
  includer?: Includer;
  templater?: Includer;
};

export const IncludeMode = {
  Source: "source",
  Scenario: "scenario",
};

export class Include {
  name: string;
  id: string;
  mode: string;
  includer: Includer;
  templater: Includer;

  constructor(options: IncludeOptions) {
    const {
      name,
      id,
      mode = IncludeMode.Source,
      includer = () => "",
      templater = (str) => str,
    } = options;

    if (!name) {
      throw new Error(`Include error. No "name" specified.`);
    }

    this.name = name;
    this.id = id ? new NameCase(id).snake : new NameCase(name).snake;
    this.mode = mode;
    this.includer = includer;
    this.templater = templater;
  }

  tag(input = "") {
    return this.includer(input);
  }

  template(input = "") {
    return this.templater(input);
  }

  static default(extname: string, id: string) {
    if (extname.endsWith(".js")) {
      return new Include({
        name: "JavaScript",
        id,
        includer: (input) => `<script type="module" src="${input}"></script>`,
      });
    } else if (extname.endsWith(".css")) {
      return new Include({
        name: "CSS",
        id,
        includer: (input) => `<link rel="stylesheet" href="${input}" />`,
      });
    } else {
      return new Include({ name: "Empty" });
    }
  }
}
