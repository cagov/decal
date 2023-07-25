import { Collection } from "./collection.js";

export class Component {
  name: string;
  dir: string;
  slug: string;
  route: string;
  collection: Collection;

  constructor(dir: string, collection: Collection) {
    this.dir = dir;
    this.name = dir.replace(/^.+\//, "");
    this.slug = `${collection.dirName}/${this.name}`;
    this.route = `/${this.slug}`;

    this.collection = collection;
  }
}
