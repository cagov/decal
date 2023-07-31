import * as path from "path";
import mime from "mime-types";
import { Include } from "./include.js";

export type Formatter = (
  filePath: string,
  contents: string
) => string | Promise<string>;

export type FilePointNamer = (componentName: string) => string;

const defaultFormatter: Formatter = (_, contents: string) => contents;

export type FormatOptions = {
  name?: string;
  id?: string;
  entryPoint?: string | FilePointNamer;
  exitPoint?: string | FilePointNamer | boolean;
  formatter?: Formatter;
  include?: Include | boolean;
  extname?: string;
  mimeType?: string;
  src?: {
    extname?: string;
    mimeType?: string;
  };
  dist?: {
    extname?: string;
    mimeType?: string;
  };
};

export class Format {
  name: string;
  id: string;
  formatter: Formatter;
  include: Include;
  entryPoint: FilePointNamer;
  exitPoint: FilePointNamer;
  src: {
    extname: string;
    mimeType: string;
  };
  dist: {
    extname: string;
    mimeType: string;
  };

  constructor(name: string, options: FormatOptions) {
    const {
      id,
      formatter = defaultFormatter,
      include = true,
      entryPoint,
      exitPoint,
      extname,
      mimeType,
      src,
      dist,
    } = options;

    if (!name) {
      throw new Error(`Loader error. No "name" specified.`);
    }

    this.name = name;
    this.id = id
      ? id.replace(/\W/g, "").toLowerCase()
      : name.replace(/\W/g, "").toLowerCase();

    this.formatter = formatter;

    this.src = { extname: "", mimeType: "" };
    this.dist = { extname: "", mimeType: "" };

    const srcExtnameDef = src && src.extname ? src.extname : extname;

    // Epic, terrible if statement.
    if (srcExtnameDef && entryPoint) {
      this.src.extname = srcExtnameDef;
      this.entryPoint =
        typeof entryPoint === "function" ? entryPoint : () => entryPoint;
    } else if (srcExtnameDef && !entryPoint) {
      this.src.extname = srcExtnameDef;
      this.entryPoint = (componentName) => `${componentName}${srcExtnameDef}`;
    } else if (entryPoint && !srcExtnameDef) {
      const entryPointDef: FilePointNamer =
        typeof entryPoint === "function" ? entryPoint : () => entryPoint;
      this.entryPoint = entryPointDef;
      this.src.extname = path.extname(entryPointDef("placebo"));
    } else {
      throw new Error(
        `Loader error: ${name}. No inputs defined. Add an entryPoint, extname, or src to your format definition.`
      );
    }

    this.src.mimeType =
      src && src.mimeType
        ? src.mimeType
        : mimeType ||
          mime.lookup(this.src.extname) ||
          "application/octet-stream";

    const distExtnameDef = dist && dist.extname ? dist.extname : extname;

    // Another awful if statement.
    if (distExtnameDef && exitPoint) {
      this.dist.extname = distExtnameDef;
      this.exitPoint =
        typeof exitPoint === "function"
          ? exitPoint
          : (componentName) => `${componentName}/${exitPoint}`;
    } else if (distExtnameDef && exitPoint === false) {
      this.dist.extname = distExtnameDef;
      this.exitPoint = () => "";
    } else if (
      distExtnameDef &&
      (exitPoint === undefined || exitPoint === true)
    ) {
      this.dist.extname = distExtnameDef;
      this.exitPoint = (componentName) => `${componentName}${distExtnameDef}`;
    } else if (exitPoint && !distExtnameDef) {
      const exitPointDef: FilePointNamer =
        typeof exitPoint === "function"
          ? exitPoint
          : (componentName) => `${componentName}/${exitPoint}`;
      this.exitPoint = exitPointDef;
      this.dist.extname = path.extname(exitPointDef("placebo"));
    } else if (!distExtnameDef && exitPoint === undefined) {
      this.dist.extname = this.src.extname;
      this.exitPoint = (componentName) => `${componentName}${this.src.extname}`;
    } else {
      this.exitPoint = () => "";
      this.dist.extname = this.src.extname;
    }

    this.dist.mimeType =
      dist && dist.mimeType
        ? dist.mimeType
        : mimeType ||
          mime.lookup(this.dist.extname) ||
          "application/octet-stream";

    if (include === true) {
      this.include = Include.default(this.dist.extname, this.id);
    } else if (include === false || include === undefined) {
      this.include = new Include("Empty");
    } else {
      this.include = include;
    }
  }

  /*
  buildToFile(component: Component, config: Config) {
    const builders: Promise<void>[] = [];

    const filePaths = this.entryPoints.map(
      (entryPoint) => `${component.dir}/src/${entryPoint}`
    );

    filePaths.forEach((filePath) => {
      const promise = fs
        .readFile(filePath, "utf-8")
        .catch((err) => {
          throw new FileReadError(err.message, err.code, err.path);
        })
        .then((contents) => this.formatter(filePath, contents))
        .then(async (result) => {
          const outFilePath = filePath
            .replace(this.src.extname, this.dist.extname)
            .replace("/src", "")
            .replace(config.dirs.target, `${config.dirs.target}/_dist`);

          const outFileDir = path.dirname(outFilePath);

          await fs.mkdir(outFileDir, { recursive: true });
          return fs.writeFile(outFilePath, result).then(() => {
            console.log(
              `${chalk.magenta(this.name)}: ${config.dirs.relative(
                outFilePath
              )}`
            );
          });
        })
        .catch((err) => {
          if (!(err.name === "FileReadError")) {
            console.log(err.message);
          }
        });

      builders.push(promise);
    });

    return builders;
  }
  */
}
