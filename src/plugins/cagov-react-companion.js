import { getEnvironment, getRenderer } from "../nunjucks.js";

export default (decalConfig) => {
  const { dirs } = decalConfig;

  const templatesDir = `${dirs.templates}/scaffold/cagov-react-companion`;
  const nunjucksEnv = getEnvironment(templatesDir);
  const renderToFile = getRenderer(nunjucksEnv);

  decalConfig.addLoader("jsx-loader", {
    name: "JSX via esbuild",
    processorID: "esbuild",
    entryPoints: ["react.jsx"],
    src: { extname: ".jsx" },
    dist: { extname: ".js" },
  });

  decalConfig.addScaffold(
    "cagov-react-companion-scaffold",
    async (dir, names, collection) => {
      const params = {
        names,
        collection,
      };

      await Promise.all([
        renderToFile("react-example.html.njk", `${dir}/demo`, params),
        renderToFile("react-example.jsx.njk", `${dir}/demo`, params),
        renderToFile("react.jsx.njk", `${dir}/src`, params),
      ]);
    }
  );
};
