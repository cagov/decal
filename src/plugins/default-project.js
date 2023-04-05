import defaultLoaderTagsPlugin from "./default-loader-tags.js";
import cagovWebComponentPlugin from "./cagov-web-component.js";
import cagovSassComponentPlugin from "./cagov-sass-component.js";
import cagovReactCompanion from "./cagov-react-companion.js";

export default (decalConfig) => {
  decalConfig.addPlugin(defaultLoaderTagsPlugin);

  decalConfig.addPlugin(cagovWebComponentPlugin);
  decalConfig.addPlugin(cagovSassComponentPlugin);

  decalConfig.addPlugin(cagovReactCompanion);
};
