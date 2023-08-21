import { ProjectComponent } from "../../component";

export default (
  component: ProjectComponent
) => `<!-- ${component.case.param}.demo.html -->

<!-- Your <cagov-${component.case.param}> component starts here. -->

<cagov-${component.case.param}>
  <img slot="the-bear" src="hard-hat-bear.jpg" alt="California bear wearing a hard hat" width="300"/>
  <h1 slot="heading">${component.case.sentence}</h1>
  <div slot="content">
    <p>Welcome to your new California Design System component!</p>
    <p>Add your sample mark-up into ${component.posixSlug}/${component.case.param}.demo.html.</p>
  </div>
</cagov-${component.case.param}>

<!-- Feel free to add additional example scenarios here! -->
`;
