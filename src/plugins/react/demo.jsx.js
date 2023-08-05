export default (component, names) => `// ${names.camelCase}.demo.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ${names.camelCase} } from './${names.camelCase}.jsx';

window.React = React;

const domNode = document.querySelector('main');
const root = createRoot(domNode);
root.render(<${names.camelCase}></${names.camelCase}>);
`;
