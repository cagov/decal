export class FileReadError extends Error {
  code: string;
  path: string;

  constructor(message: string, code: string = "", path: string = "") {
    super(message);
    this.name = "FileReadError";
    this.code = code;
    this.path = path;
  }
}
