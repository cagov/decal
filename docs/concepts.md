# Decal Concepts

Decal projects run on the following core concepts.

## Config file

Each new Decal project should come with a `decal.config.js` file. This configuration file is where all of the below concepts come into play.

## Component

The **Component** defines a discreet, stand-alone UI element in code. **Components** combine **Formats**, **Scaffolds**, and **Includes** to represent how a component's files should be named, organized, processed, previewed, and built.

## Format

The **Format** tells Decal how to recognize and process a specific file-type. A **Component** may comprise many different **Formats** simultaneously.

> For example, a **Format** might instruct Decal to pass every file with an extension of `.scss` through a [Sass](https://sass-lang.com/) pre-processor.

## Scaffold

The **Scaffold** tells Decal how to create new files for a component. A **Component** can offer several different, compatible **Scaffold** choices for creating new components. **Scaffolds** are triggered via the `npm run new` command.

> For example, a **Scaffold** could tell Decal to create an example `index.scss` and `index.demo.html` file for each new component.

## Include

The **Include** tells Decal how to load different source files and templates for preview.

> For example, an **Include** would tell your Decal project to load that `index.scss` file as CSS via `<link>` tag.

## Collection

The **Collection** aggregates a **Component** definition across many subfolders.

## Bundle

A **Bundle** is a special **Component** that recreates itself as components are added or removed from a **Collection**. **Bundles** help combine code across components into single, all-in-one exports.
