# synec

> Requires `node` >= 13.2.0

Test local npm packages in projects by listing them in `localDependencies` in the `package.json` of the project.

```
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
- Watches them for changes and rebuilds

## Installation

```
npm i synec
```

## Usage

### With script

Add `synec` in front of a `script` inside `package.json` and it will make sure `localDependencies` are installed and up-to-date when the following command starts and is watching.

```
"scripts": {
    "start": "synec && webpack --watch"
}
```

> Options: `--no-watch` disable watching for changes `--production` also install in production mode.

### As a webpack Plugin

If your setup is using `webpack` using this plugin is preferred. Inside `webpack.config.js` add

```
const { LocalDependenciesPlugin } = require('synec')
// or for node >= 14 and "type": "module"
import { LocalDependenciesPlugin } from 'synec'

plugins: [
    new LocalDependenciesPlugin()
]
```

Here are the available `options` with their respective defaults.

```
new LocalDependenciesPlugin({
    production: false,
    watch: true
})
```

`production`: Whether to also install local dependencies in production mode.

`watch`: Watch source folder of `localDependencies` for changes and automatically copy them over.

## Future

- Build local dependency before install
- Build local dependency in watch mode
- Watch dependencies of local dependencies
- Watch `localDependencies` for changes
