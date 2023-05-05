import { Config } from "./config.js";

export type IncludeTag = ((input: string) => string) | string;

export class Include {
  config: Config;
  name: string;
  tag: IncludeTag;

  constructor(config: Config, name: string, tag: IncludeTag) {
    this.config = config;
    this.name = name;
    this.tag = tag;
  }

  render(input = ""): string {
    if (typeof this.tag == "string") {
      return this.tag;
    }

    if (typeof this.tag == "function") {
      return this.tag(input);
    }

    return "";
  }
}
