export default (decalConfig) => {
  decalConfig.addLoaderTag(
    "css-tag",
    (input) => `<link rel="stylesheet" href="_src/${input}" />`
  );

  decalConfig.addLoaderTag(
    "module-tag",
    (input) => `<script type="module" src="_src/${input}"></script>`
  );
};
