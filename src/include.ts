export type Includer = (input: string) => string;

export class Include {
  includer: Includer;
  name: string;
  id: string;

  constructor(name: string, id: string = "", includer: Includer = () => "") {
    this.name = name;
    this.id =
      id.replace(/\W/g, "").toLowerCase() ||
      name.replace(/\W/g, "").toLowerCase();
    this.includer = includer;
  }

  tag(input: string = "") {
    return this.includer(input);
  }

  static default(extname: string, id: string) {
    if (extname.endsWith(".js")) {
      return new Include(
        "JavaScript",
        id,
        (input) => `<script type="module" src="${input}"></script>`
      );
    } else if (extname.endsWith(".css")) {
      return new Include(
        "CSS",
        id,
        (input) => `<link rel="stylesheet" href="${input}" />`
      );
    } else {
      return new Include("Empty");
    }
  }
}
