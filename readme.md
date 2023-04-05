# Decal

A lightweight tool for creating, developing, bundling, and sharing your web UI component libraries.

Works best when building _system-of-systems_ collections between distributed teams.

We'll try using this as the technical foundation for the Design System.

## How does it work

Decal offers a config/plugin interface that allows you to define how files should be organized and processed for each component. This system allows you to:

- Scaffold new components quickly and easily.
- Start up a dev server as _clean room_ for working on components.
- Build components for publication.

See `src/plugins` for examples.

## Current state: alpha

This tool is still at an early stage of development.

Current to-dos:

- Documentation!
- More documentation!
- Cleaner code and better comments.
- A bundle/export function. Crucial.
- More consensus around default file structure for components.
- More default plugins to support common workflows.
- More thought around the plugin/config interface.
