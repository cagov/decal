# Install a component

Most of the time, you should be able to pull a component definition "off the rack" for use in your Decal project.

Let's get started by creating a new project.

```sh
npx @cagov/decal new project
```

In the new project, you'll see a `decal.config.js` file. Let's replace the default contents of that file with the following snippet.

```js
export default (decalConfig) => {};
```

This is the most basic expression of a Decal plugin: a function that operates on a `decalConfig` object.

To install a component, we'll first grab the `web-component` plugin from Decal itself. Import it into your `decal.config.js` file, like this.

```js
import DecalWebComponent from "@cagov/decal/dist/plugins/web-component/web-component.js";

export default (decalConfig) => {};
```

We're not done yet. We've imported the component definition, but we haven't configured it for our project. Let's do that now with the `applyComponent` method of `decalConfig`.

```js
import DecalWebComponent from "@cagov/decal/dist/plugins/web-component/web-component.js";

export default (decalConfig) => {
  decalConfig.applyComponent(DecalWebComponent.Component);
};
```

At this point, we can run any Decal command, like `serve` or `build`, to automatically create our new component.

```sh
npm run build
```

You'll notice that Decal created a `web-component` folder in your project with default files inside. While this works, it's probably unsatisfying to have a component name of `web-component`. We can change that by supplying overrides to `applyComponent`.

```js
import DecalWebComponent from "@cagov/decal/dist/plugins/web-component/web-component.js";

export default (decalConfig) => {
  decalConfig.applyComponent(DecalWebComponent.Component, {
    dirName: "super-list",
  });
};
```

Decal looks at the original `DecalWebComponent.Component` definition, then replaces the default `dirName` with your own name, `super-list`. Go ahead and try `build` from your command line again.

```sh
npm run build
```

You'll see a new folder called `super-list`, with appropriately named files inside. At this point, you can delete the original `web-component` folder if you like.

Any part of the original component definition can be modified in the same way. See [Component](api-component.md) for a full list of options.

[Next, we'll create a collection from this component definition](02-create-collection.md).
