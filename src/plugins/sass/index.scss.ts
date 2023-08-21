import { ProjectComponent } from "../../component";

export default (
  component: ProjectComponent
) => `/* ${component.case.param}.scss */

.${component.case.param} {
  margin: 2rem;
}
`;
