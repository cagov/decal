import { ProjectComponent } from "../../component";

export default (component: ProjectComponent) => ` // ${component.case.param}.js

import { LitElement, css, html } from 'lit-element';

export class ${component.case.pascal} extends LitElement {
  static get properties() {
    return {
      count: { type: Number },
    };
  }

  constructor() {
    super();
    this.count = 0;
  }

  increment() {
    this.count += 1;
  }

  static get styles() {
    return css\`
      #container {
        margin: 2rem;
      }

      #counter-widget {
        background-color: bisque;
        padding: .5rem 2rem;
        margin: 1rem 0 2rem 0;
        border-radius: 1rem;
        display: inline-block;
      }

      button {
        padding: 1rem;
        border-radius: .5rem;
        font-size: 1.2em;
        cursor: pointer
      }
    \`;
  }

  render() {
    return html\`
      <div id="container">
        <slot name="the-bear"></slot>

        <slot name="heading">
          <h1>Default Heading</h1>
        </slot>

        <div id="counter-widget">
          <p>This example counter widget is inserted via JavaScript.</p>
          <p>Check out the code in <em>${component.posixSlug}/${component.case.param}.js</em>.</p>
          <button type="button" id="counter-button" @click="\${this.increment}">Increment counter</button>
          <p>You've clicked the button <span id="count">\${this.count}</span> times.</p>
        </div>

        <slot name="content">
          <p>Default content!</p>
        </slot>
      </div>
    \`;
  }
}

window.customElements.define("cagov-${component.case.param}", ${component.case.pascal});

export default ${component.case.pascal};
`;
