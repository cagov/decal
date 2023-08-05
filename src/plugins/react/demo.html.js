export default (component, names) => `<!-- ${names.camelCase}.demo.html -->

<script type="module" src="${names.camelCase}.demo.jsx"></script>
<main></main>
`;
