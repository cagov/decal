export default (component, names) => `<!-- ${names.kebabCase}.demo.html -->

<!-- Your <cagov-${names.kebabCase}> component starts here. -->

<cagov-${names.kebabCase}>
  <img slot="the-bear" src="hard-hat-bear.jpg" alt="California bear wearing a hard hat" width="300"/>
  <h1 slot="heading">${names.plainCase}</h1>
  <div slot="content">
    <p>Welcome to your new California Design System component!</p>
    <p>Add your sample mark-up into ${component.slug}/${names.kebabCase}.demo.html.</p>
  </div>
</cagov-${names.kebabCase}>

<!-- Feel free to add additional example scenarios here! -->
`;
