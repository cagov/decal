export default (decalConfig) => {
  decalConfig.addLoaderTag(
    "css-tag",
    (input) => `<link rel="stylesheet" href="src/${input}" />`
  );

  decalConfig.addLoaderTag(
    "module-tag",
    (input) => `<script type="module" src="src/${input}"></script>`
  );
};
