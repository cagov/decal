import { ProjectComponent } from "../../component";

export default (
  component: ProjectComponent
) => `<!-- ${component.case.param}.shadow.html -->

<div id="container">
  <slot name="the-bear"></slot>

  <slot name="heading">
    <h1>Default Heading</h1>
  </slot>

  <div id="counter-widget">
    <p>This example counter widget is inserted via JavaScript.</p>
    <p>Check out the code in <em>${component.slug}/${component.case.param}.js</em>.</p>
    <button type="button" id="counter-button">Increment counter</button>
    <p>You've clicked the button <span id="count">0</span> times.</p>
  </div>

  <slot name="content">
    <p>Default content!</p>
  </slot>
</div>
`;
