import { ProjectComponent } from "../../component";

export default (
  component: ProjectComponent
) => `// ${component.case.pascal}.demo.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ${component.case.pascal} } from './${component.case.pascal}.jsx';

window.React = React;

const domNode = document.querySelector('main');
const root = createRoot(domNode);

const DemoComponent = () => {
  return <${component.case.pascal}></${component.case.pascal}>
}

root.render(<DemoComponent/>);
`;
