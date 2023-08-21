import * as path from "path";
import { promises as fs } from "fs";
import mime from "mime-types";
import { Include } from "./include.js";
import { ProjectCollection } from "./collection.js";
import chalk from "chalk";
import { ProjectComponent } from "./component.js";
import { FileReadError } from "./errors.js";

export type Formatter = (
  filePath: string,
  contents: string
) => string | Promise<string>;

export type FilePointNamer = (componentName: string) => string;
export type BundlePointNamer = (
  componentName: string,
  collection: ProjectCollection
) => string;

const defaultFormatter: Formatter = (_, contents: string) => contents;

export type FormatOptions = {
  name: string;
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
  formatOptions?: any;
  serveOptions?: any;
  buildOptions?: any;
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
  formatOptions: any;
  serveOptions: any;
  buildOptions: any;
  canServe: boolean = true;
  canBuild: boolean = true;

  constructor(options: FormatOptions) {
    const {
      name,
      id,
      formatter = defaultFormatter,
      include = true,
      entryPoint,
      exitPoint,
      extname,
      mimeType,
      src,
      dist,
      formatOptions,
      serveOptions,
      buildOptions,
    } = options;

    if (!name) {
      throw new Error(`Loader error. No "name" specified.`);
    }

    this.name = name;
    this.id = id
      ? id.replace(/\W/g, "").toLowerCase()
      : name.replace(/\W/g, "").toLowerCase();

    this.formatter = formatter;

    this.serveOptions = serveOptions || {};
    this.buildOptions = buildOptions || {};
    this.formatOptions = formatOptions || {};

    this.src = { extname: "", mimeType: "" };
    this.dist = { extname: "", mimeType: "" };

    const srcExtnameDef = src && src.extname ? src.extname : extname;

    // Epic, terrible if statement.
    // The goal here is to derive useful defaults based on what we get.
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
    // Again, we're extracting defaults for incomplete configs.
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

  async buildToFile(component: ProjectComponent) {
    const entryPoint = this.entryPoint(component.dirName);
    const exitPoint = this.exitPoint(component.dirName);

    if (exitPoint) {
      const filePath = path.join(component.dir, entryPoint);

      const promise = fs
        .readFile(filePath, "utf-8")
        .catch((err) => {
          throw new FileReadError(err.message, err.code, err.path);
        })
        .then((contents) => this.formatter(filePath, contents))
        .then(async (result) => {
          const outFile = path.join(
            component.project.dir,
            "_dist",
            component.slug,
            exitPoint
          );
          const outDir = path.dirname(outFile);

          await fs.mkdir(outDir, { recursive: true });
          return fs.writeFile(outFile, result).then(() => {
            const loggablePath = component.project.dirs.relative(outFile);
            console.log(`${chalk.magenta(this.name)}: ${loggablePath}`);
          });
        })
        .catch((err) => {
          if (!(err.name === "FileReadError")) {
            console.log(err.message);
          }
        });

      await promise;
    }
  }
}
