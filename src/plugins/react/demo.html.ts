import { ProjectComponent } from "../../component";

export default (
  component: ProjectComponent
) => `<!-- ${component.case.pascal}.demo.html -->

<script type="module" src="${component.case.pascal}.demo.jsx"></script>
<main></main>
`;
