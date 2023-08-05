import WebComponent from "./web-component/web-component.js";
import Sass from "./sass/sass.js";

export default (decalConfig) => {
  decalConfig.applyCollection(WebComponent.Collection, {
    dirName: "components",
  });
  decalConfig.applyCollection(Sass.Collection, { dirName: "styles" });
};
