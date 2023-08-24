import { ProjectComponent } from "../../component";

export default (component: ProjectComponent) => `// ${component.case.pascal}.jsx

export const ${component.case.pascal} = (props) => {
  return <div className="react-${component.case.param}">
    <img
      slot="the-bear"
      src="/assets/hard-hat-bear.jpg"
      alt="California bear wearing a hard hat"
      width="300"
    />

    <h1>{props.heading}</h1>

    <div>
      {props.children}
    </div>
  </div>
}
`;
