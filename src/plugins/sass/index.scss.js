export default (component, names) => `/* ${names.kebabCase}.scss */

.${names.kebabCase} {
  margin: 2rem;
}
`;
