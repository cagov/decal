import { ProjectComponent } from "../../component";

export default (
  component: ProjectComponent
) => `/* ${component.case.param}.css */

.${component.case.param} {
  margin: 2rem;
}
`;
