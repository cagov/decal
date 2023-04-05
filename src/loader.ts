import * as path from "path";
import mime from "mime-types";
import { Config } from "./config.js";

type FileTypeOptions = {
  extname?: string;
  mimeType?: string;
};

type LoaderCoreOptions = {
  name: string;
  processorID: string;
  entryPoints: string[];
  tagID?: string;
};

export type LoaderOptions = LoaderCoreOptions &
  FileTypeOptions & {
    src?: FileTypeOptions;
    dist?: FileTypeOptions;
  };

export type LoaderTag = (input: string) => string;

export class Loader {
  config: Config;
  id: string;
  name: string;
  processorID: string;
  tagID: string;
  entryPoints: string[];
  src: Required<FileTypeOptions>;
  dist: Required<FileTypeOptions>;

  constructor(config: Config, id: string, options: LoaderOptions) {
    this.config = config;
    this.id = id;

    const {
      name,
      processorID,
      tagID = "",
      entryPoints,
      extname,
      mimeType,
      src,
      dist,
    } = options;

    this.name = name;
    this.processorID = processorID;
    this.entryPoints = entryPoints;
    this.tagID = tagID;

    const srcExtname =
      src && src.extname
        ? src.extname
        : extname || path.extname(entryPoints[0]);

    const srcMimeType =
      src && src.mimeType
        ? src.mimeType
        : mimeType || mime.lookup(srcExtname) || "application/octet-stream";

    this.src = {
      extname: srcExtname,
      mimeType: srcMimeType,
    };

    const distExtname =
      dist && dist.extname
        ? dist.extname
        : extname || path.extname(entryPoints[0]);

    const distMimeType =
      dist && dist.mimeType
        ? dist.mimeType
        : mimeType || mime.lookup(distExtname) || "application/octet-stream";

    this.dist = {
      extname: distExtname,
      mimeType: distMimeType,
    };
  }

  static new(config: Config, id: string, options: LoaderOptions) {
    const { name, processorID, entryPoints } = options;

    let accept = true;

    if (config.loaders.get(id)) {
      console.log(`Loader error: ${id}. A loader with this ID already exists.`);
      accept = false;
    }

    if (!name) {
      console.log(`Loader error: ${id}. The "name" option is required.`);
      accept = false;
    }

    if (!processorID) {
      console.log(`Loader error: ${id}. No "processorID" specified.`);
      accept = false;
    }

    if (!entryPoints || (entryPoints && !entryPoints.length)) {
      console.log(`Loader error: ${id}. No "entryPoint" specified.`);
      accept = false;
    }

    return accept ? new Loader(config, id, options) : undefined;
  }

  get processor() {
    return this.config.processors.get(this.processorID);
  }

  get tag() {
    return this.config.loaderTags.get(this.tagID);
  }
}
