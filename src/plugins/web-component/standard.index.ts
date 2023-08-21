import { ProjectComponent } from "../../component";

export default (component: ProjectComponent) => `// ${component.case.param}.js

import shadowStyles from "./${component.case.param}.shadow.css";
import shadowTemplate from "./${component.case.param}.shadow.html";

export class ${component.case.pascal} extends window.HTMLElement {
  constructor() {
    super();
    this.setUpShadowDOM();

    this.count = 0;
  }

  connectedCallback() {
    const button = this.shadowRoot.querySelector("#counter-button");
    const count = this.shadowRoot.querySelector("#count");

    button.addEventListener("click", (event) => {
      this.count += 1;
      count.innerHTML = this.count;
    });
  }

  /**
   * setUpShadowDOM is our simple, seven-line framework for building web components.
   * You can use, ignore, or remove this, depending on your needs.
   */
  setUpShadowDOM() {
    // First, populate a <template> element from the shadow.template.html file.
    const template = document.createElement("template");
    template.innerHTML = shadowTemplate;

    // Next, add CSS from shadow.styles.css into the above <template> element.
    const style = document.createElement("style");
    style.append(shadowStyles);
    template.content.prepend(style);

    // Enable the ShadowDOM on this custom element.
    this.attachShadow({ mode: "open" });

    // Finally, add our above <template> into the element's shadowRoot.
    this.shadowRoot.append(template.content.cloneNode(true));
  }
}

// This declaration lets you use the <cagov-${component.case.param}> tag on your pages.
window.customElements.define("cagov-${component.case.param}", ${component.case.pascal});

export default ${component.case.pascal};
`;
