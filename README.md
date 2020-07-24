<p align="center">
  <img src="https://raw.githubusercontent.com/tobua/synec/master/logo.png" alt="synec" width="300">
</p>

# synec

Test local npm packages in projects by listing them in `localDependencies` in the `package.json` of the project.

```json
{
    "name": "your-project",
    "dependencies" {
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
"scripts": {
    "start": "synec && webpack --watch"
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

## Future

- Build local dependency before install
- Build local dependency in watch mode
- Watch dependencies of local dependencies
- Watch `localDependencies` for changes
