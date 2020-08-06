<p align="center">
  <img src="https://github.com/tobua/synec/raw/master/logo.png" alt="synec" width="300">
</p>

# synec

Test local npm packages in projects by listing them in `localDependencies` in the `package.json` of the project.

```json
{
  "name": "your-project",
  "dependencies": {
    "react": ""
  },
  "localDependencies": {
    "my-react-plugin": "../my-react-plugin"
  }
}
```

## Features

- Installs `localDependencies` before build
- Watches for changes and rebuilds

## Installation

> Requires `node` >= 13.2.0

```
npm i synec
```

## Usage

This functionality can either be added as a webpack plugin or as an additional command ahead of your build scripts.

### With scripts

Add `synec` in front of a `script` inside `package.json` and it will make sure `localDependencies` are installed and up-to-date when the following command starts. It will continue watching the files and keep them in sync even when the following script runs in watch mode as well.

```json
{
  "scripts": {
    "start": "synec && webpack --watch"
  }
}
```

> Options: `--no-watch` disable watching for changes `--production` also install in production mode.

### As a webpack Plugin

If your setup is using `webpack` using this plugin is preferred. Inside `webpack.config.js` add

```js
const { LocalDependenciesPlugin } = require('synec')
// or as ES module
import { LocalDependenciesPlugin } from 'synec'

plugins: [new LocalDependenciesPlugin()]
```

Here are the available `options` with their respective defaults.

```js
new LocalDependenciesPlugin({
  production: false,
  watch: true,
})
```

`production`: Whether to also install local dependencies in production mode.

`watch`: Watch source folder of `localDependencies` for changes and automatically copy them over.

## Motivation

If you want to test your plugin or a fork of a popular plugin that you modified locally in your project you can do this by installing it through npm like `npm install ../my-plugin` or list it in dependencies as `"my-plugin": "file:../my-plugin"`. However this will not install the plugin as it would do for a published npm package. It's creating a [symlink](https://en.wikipedia.org/wiki/Symbolic_link) to your project inside `node_modules` and the plugins dependencies will not be installed in your project as it's using the one's found inside the symlink. For me personally this often resulted in problems and didn't adequately mock the environment that would later exist once the plugin is published on npm.

For a quick solution you can also do `npm i --no-save $(npm pack ../my-plugin | tail -1)` which is what this plugin does and what I used to test it. It will install the plugin as if were published to npm.

## Upcoming Features

- Build local dependency before install
- Build local dependency in watch mode
- Watch dependencies of local dependencies
- Watch `localDependencies` for changes
- Refresh after plugin installed
