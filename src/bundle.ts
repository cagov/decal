import { ProjectCollection } from "./collection.js";

export type Bundler = (collection: ProjectCollection) => void | Promise<void>;

export class Bundle {
  name: string;
  bundler: Bundler;

  constructor(name: string, bundler: Bundler) {
    this.name = name;
    this.bundler = bundler;
  }

  async make(collection: ProjectCollection) {
    const bundling = Promise.resolve(this.bundler(collection));
    return bundling;
  }
}
