export default (decalConfig) => {
  decalConfig.addInclude(
    "css-tag",
    (input) => `<link rel="stylesheet" href="src/${input}" />`
  );

  decalConfig.addInclude(
    "module-tag",
    (input) => `<script type="module" src="src/${input}"></script>`
  );

  decalConfig.addInclude(
    "base-css",
    `<link rel="stylesheet" href="/_templates/base-css.scss" />`
  );
};
