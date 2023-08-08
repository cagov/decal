export type Includer = (input: string) => string;

export class Include {
  includer: Includer;
  name: string;
  id: string;

  constructor(name: string, includer: Includer = () => "", id: string = "") {
    this.name = name;
    this.id =
      id.replace(/\W/g, "").toLowerCase() ||
      name.replace(/\W/g, "").toLowerCase();
    this.includer = includer;
  }

  tag(input = "") {
    return this.includer(input);
  }

  static default(extname: string, id: string) {
    if (extname.endsWith(".js")) {
      return new Include(
        "JavaScript",
        (input) => `<script type="module" src="${input}"></script>`,
        id
      );
    } else if (extname.endsWith(".css")) {
      return new Include(
        "CSS",
        (input) => `<link rel="stylesheet" href="${input}" />`,
        id
      );
    } else {
      return new Include("Empty");
    }
  }
}
