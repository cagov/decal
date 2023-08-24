import { ProjectComponent } from "../../component";

export default (
  component: ProjectComponent
) => `<!-- ${component.case.param}.demo.html -->

<!--Your .${component.case.param} class starts here. -->

<div class="${component.case.param}">
  <img slot="the-bear" src="/assets/hard-hat-bear.jpg" alt="California bear wearing a hard hat" width="300"/>
  <h1>${component.case.sentence}</h1>
  <p>Welcome to your new California Design System component!</p>
  <p>Add your sample mark-up into ${component.posixSlug}/${component.case.param}.demo.html.</p>
</div>

<!-- Feel free to add additional example scenarios here! -->
`;
