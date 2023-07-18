import { WebComponentCollection } from "./cagov-web-component.js";
import { SassCollection } from "./cagov-sass-component.js";

export default (decalConfig) => {
  decalConfig.applyCollection(WebComponentCollection, {
    dirName: "components",
  });
  decalConfig.applyCollection(SassCollection, { dirName: "styles" });
};
