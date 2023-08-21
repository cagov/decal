import { ProjectComponent } from "../../component";

export default (component: ProjectComponent) => `// ${component.case.pascal}.jsx

import "../../web-components/${component.case.param}/${component.case.param}.js";

export const ${component.case.pascal} = () => {
  return <cagov-${component.case.param}></cagov-${component.case.param}>
}
`;
