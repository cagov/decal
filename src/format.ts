import * as path from "path";
import mime from "mime-types";

export type Formatter = (
  filePath: string,
  contents: string
) => string | Promise<string>;

export type IncludeTag = (input: string) => string;

const defaultFormatter: Formatter = (_, contents: string) => contents;

export type FormatOptions = {
  name: string;
  entryPoints: string[];
  formatter?: Formatter;
  includeTag?: IncludeTag | boolean;
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
  formatter: Formatter;
  includeTag: IncludeTag;
  entryPoints: string[];
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
      formatter = defaultFormatter,
      includeTag = true,
      entryPoints,
      extname,
      mimeType,
      src,
      dist,
    } = options;

    if (!name) {
      throw new Error(`Loader error. No "name" specified.`);
    }

    if (!entryPoints || (entryPoints && !entryPoints.length)) {
      throw new Error(`Loader error: ${name}. No "entryPoint" specified.`);
    }

    this.name = name;
    this.formatter = formatter;
    this.entryPoints = entryPoints;

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

    if (typeof includeTag === "function") {
      this.includeTag = includeTag;
    } else if (includeTag !== false && this.dist.extname.endsWith(".js")) {
      this.includeTag = (input) =>
        `<script type="module" src="src/${input}"></script>`;
    } else if (includeTag !== false && this.dist.extname.endsWith(".css")) {
      this.includeTag = (input) =>
        `<link rel="stylesheet" href="src/${input}" />`;
    } else {
      this.includeTag = () => "";
    }
  }
}
