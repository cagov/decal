export default (component, names) => `// ${names.camelCase}.jsx

import "../../components/${names.kebabCase}/${names.kebabCase}.js";

export const ${names.camelCase} = () => {
  return <cagov-${names.kebabCase}></cagov-${names.kebabCase}>
}
`;
