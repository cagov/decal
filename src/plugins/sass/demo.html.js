export default (component, names) => `<!-- ${names.kebabCase}.demo.html -->

<!--Your .${names.kebabCase} class starts here. -->

<div class="${names.kebabCase}">
  <img slot="the-bear" src="hard-hat-bear.jpg" alt="California bear wearing a hard hat" width="300"/>
  <h1>${names.plainCase}</h1>
  <p>Welcome to your new California Design System component!</p>
  <p>Add your sample mark-up into ${component.slug}/${names.kebabCase}.demo.html.</p>
</div>

<!-- Feel free to add additional example scenarios here! -->
`;
