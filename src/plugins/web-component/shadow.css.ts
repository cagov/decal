import { ProjectComponent } from "../../component";

export default (
  component: ProjectComponent
) => `/* ${component.case.param}.shadow.css */

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
`;
