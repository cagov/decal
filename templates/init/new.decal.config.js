import DecalWebComponent from "decal/dist/plugins/web-component/web-component.js";
import DecalSass from "decal/dist/plugins/sass/sass.js";
import DecalReact from "decal/dist/plugins/react/react.js";

export default (decalConfig) => {
  decalConfig.applyCollection(DecalWebComponent.Collection);
  decalConfig.applyCollection(DecalSass.Collection);
  decalConfig.applyCollection(DecalReact.Collection);
};
