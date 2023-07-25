import * as path from "path";
import mime from "mime-types";
import { Include } from "./include.js";

export type Formatter = (
  filePath: string,
  contents: string
) => string | Promise<string>;

const defaultFormatter: Formatter = (_, contents: string) => contents;

export type FormatOptions = {
  name: string;
  id?: string;
  entryPoint: string;
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
  entryPoint: string;
  src: {
    extname: string;
    mimeType: string;
  };
  dist: {
    extname: string;
    mimeType: string;
  };

  constructor(options: FormatOptions) {
    const {
      name,
      id,
      formatter = defaultFormatter,
      include = true,
      entryPoint,
      extname,
      mimeType,
      src,
      dist,
    } = options;

    if (!name) {
      throw new Error(`Loader error. No "name" specified.`);
    }

    if (!entryPoint) {
      throw new Error(`Loader error: ${name}. No "entryPoint" specified.`);
    }

    this.name = name;
    this.id = id
      ? id.replace(/\W/g, "").toLowerCase()
      : name.replace(/\W/g, "").toLowerCase();
    this.formatter = formatter;
    this.entryPoint = entryPoint;

    const srcExtname =
      src && src.extname ? src.extname : extname || path.extname(entryPoint);

    const srcMimeType =
      src && src.mimeType
        ? src.mimeType
        : mimeType || mime.lookup(srcExtname) || "application/octet-stream";

    this.src = {
      extname: srcExtname,
      mimeType: srcMimeType,
    };

    const distExtname =
      dist && dist.extname ? dist.extname : extname || path.extname(entryPoint);

    const distMimeType =
      dist && dist.mimeType
        ? dist.mimeType
        : mimeType || mime.lookup(distExtname) || "application/octet-stream";

    this.dist = {
      extname: distExtname,
      mimeType: distMimeType,
    };

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
