# Decal

Decal is a lightweight tool for creating, developing, building, and sharing your web UI component libraries.

It works best when building _system-of-systems_ collections between distributed teams.

## How does it work

Decal helps you define the _shape_ of your components, including:

- How folders should be structured
- How files should be named
- How new components should be created
- How components should be loaded and processed
- How components should be previewed and tested

Decal then offers powerful conveniences.

- Start the built-in dev server to work on your code.
- Mix, match, play, and build in different front-end frameworks (React, Vue, etc.) all at once.
- Create new components with a single command.
- Build and bundle your components without fuss or fear.
- Export your file structure and build processes to other teams.

## Getting started

First, you'll need to install [NodeJS](https://nodejs.org) (v18 or above).

Then open up your terminal and enter the following command.

```sh
npx @cagov/decal new project
```

Follow the prompts to create and run your own Decal project.

## Configuring your project

Decal runs atop a plugin-based architecture. Check out our [Configuration](docs/configuration.md) guide to customize your Decal project.

## Current state: alpha

This tool is still at an early stage of development.

Current to-dos:

- More documentation
- Custom, partial bundles on demand
- Sourcemap support
- Richer default plugins
- More plugins
