import WebComponent from "./web-component/web-component.js";
import Sass from "./sass/sass.js";

export default (decalConfig) => {
  decalConfig.applyCollection(WebComponent.Collection);
  decalConfig.applyCollection(Sass.Collection);
};
