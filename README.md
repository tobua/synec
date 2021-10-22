<p align="center">
  <img src="https://github.com/tobua/synec/raw/main/logo.png" alt="synec" width="300">
</p>

# synec

Install local npm packages by listing them as `localDependencies` in your `package.json`.

```json
{
  "name": "my-project",
  "dependencies": {
    "react": "^17.0.0"
  },
  "localDependencies": {
    "my-react-plugin": "../my-react-plugin"
  }
}
```

## Features

- Installs npm packages from local folders
- Watches for changes and copies them over directly
- Installs `dependencies` of local packages
- Reinstalls only when changes have been made
- Runs `build` or `watch` script before installing plugin
- webpack plugin for seamless integration

## Installation

> Requires `node` >= 14 (Published as ES Module, localDependencies possible with ESM or CJS)

```
npm install synec
```

## Options

`synec --watch` (default `false`) Watch `localDependencies` for changes until the current script is closed.

`synec --no-script` (default `true`) Disable running `build` or `watch` script before installing the plugin.

`synec --no-production` (default `true`) Don't install localDependencies in `process.env.NODE_ENV === 'production'` or webpack production mode.

## Usage

There are different ways how and where to integrate the plugin approprite for different use cases.

### Installation before running scripts

Add `synec` in front of a `script` inside `package.json` and it will make sure `localDependencies` are installed and up-to-date when the following command starts. The next script in the chain will be started once the installation is done.

```json
{
  "scripts": {
    "start": "synec --watch && webpack serve",
    "watch": "synec --watch && webpack watch",
    "build": "synec && webpack build"
  }
}
```

### Installation together with regular dependencies

`localDependencies` can be installed along with regular ones by adding a postinstall script that will be run during a regular install with `npm install`.

```json
{
  "scripts": {
    "start": "webpack --watch",
    "postinstall": "synec"
  }
}
```

### Right before Build as a webpack Plugin

If your setup is using `webpack` using this plugin is preferred. Create a `webpack.config.js` and add the plugin there.

```js
// File webpack.config.js
import { LocalDependenciesPlugin } from 'synec'

export default {
  plugins: [new LocalDependenciesPlugin()],
}
```

Note that this only works if your project is set up with ES Modules (`"type": "module"` in `package.json`). The same options as described above are available.

```js
new LocalDependenciesPlugin({
  // Watch localDependencies for changes and automatically copy them over.
  watch: true, // Always disabled in webpack-production mode, default: false.
  // If available run build or watch script before installation.
  script: false, // default, true.
  // Also install local dependencies in production mode.
  production: false, // default, true.
})
```

## Motivation

If you want to test your plugin or a fork of a popular plugin that you modified locally in your project you can do this by installing it through npm like `npm install ../my-plugin` or list it in dependencies as `"my-plugin": "file:../my-plugin"`. However this will not install the plugin as it would do for a published npm package. It's creating a [symlink](https://en.wikipedia.org/wiki/Symbolic_link) to your project inside `node_modules` and the plugins dependencies will not be installed in your project as it's using the one's found inside the symlink. For me personally this often resulted in problems and didn't adequately mock the environment that would later exist once the plugin is published on npm.

For a quick solution you can also do `npm i --no-save $(npm pack ../my-plugin | tail -1)` which is what this plugin does and what I used to test it. It will install the plugin as if were published to npm.

## Upcoming Features

- `npx synec --path ../my-plugin`
- Watch dependencies of local dependencies in package.json
- Watch `localDependencies` object in package.json for changes

## Similar

This plugin is similar and partially inspired by [relative-deps](https://github.com/mweststrate/relative-deps) but provides additional features such as installing plugin dependencies, watching for changes and integration into build tools which are deemed essential for optimal developer experience.
