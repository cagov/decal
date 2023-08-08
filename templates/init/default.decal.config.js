import DecalWebComponent from "../../dist/plugins/web-component/web-component.js";
import DecalSass from "../../dist/plugins/sass/sass.js";
import DecalReact from "../../dist/plugins/react/react.js";

export default (decalConfig) => {
  decalConfig.applyCollection(DecalWebComponent.Collection);
  decalConfig.applyCollection(DecalSass.Collection);
  decalConfig.applyCollection(DecalReact.Collection);
};
