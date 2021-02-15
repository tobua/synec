# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.16](https://github.com/tobua/synec/compare/v0.1.15...v0.1.16) (2021-02-15)


### Bug Fixes

* **watch:** copy create directory path absolute ([b63d689](https://github.com/tobua/synec/commit/b63d68930117163412205b3b5c43234a2b05a17a))

### [0.1.15](https://github.com/tobua/synec/compare/v0.1.14...v0.1.15) (2021-02-11)


### Bug Fixes

* **watch:** fix watch tests and workaround for change in npm ([e2501a5](https://github.com/tobua/synec/commit/e2501a594613ae73d3ddb23aa23ea6fd80aec3fb))

### [0.1.14](https://github.com/tobua/synec/compare/v0.1.13...v0.1.14) (2020-12-27)


### Bug Fixes

* **watch:** make sure directory exists when attempting to copy ([15067af](https://github.com/tobua/synec/commit/15067afaa644ff8a64cb1a41276d10b90e2d203c))

### [0.1.13](https://github.com/tobua/synec/compare/v0.1.12...v0.1.13) (2020-11-26)


### Bug Fixes

* **npm:** install with legacy peer deps to ensure install with npm 7 ([07bd844](https://github.com/tobua/synec/commit/07bd84499dbb06ec97297cb26c2e5accd3b1790e))

### [0.1.12](https://github.com/tobua/synec/compare/v0.1.11...v0.1.12) (2020-11-03)


### Bug Fixes

* **plugin:** plugin also in production but with disabled watch mode ([bebe040](https://github.com/tobua/synec/commit/bebe040b354dd10d3663c114a4d573398735cae8))

### [0.1.11](https://github.com/tobua/synec/compare/v0.1.10...v0.1.11) (2020-10-26)

### [0.1.10](https://github.com/tobua/synec/compare/v0.1.9...v0.1.10) (2020-10-26)


### Bug Fixes

* **cache:** disable webpack cache in Plugin watch mode ([26ab7e6](https://github.com/tobua/synec/commit/26ab7e6237743ffaa1b59edd078c00cb01cbe6d3))

### [0.1.9](https://github.com/tobua/synec/compare/v0.1.8...v0.1.9) (2020-10-25)


### Bug Fixes

* **scripts:** improve watch script to run npm bins properly ([26d6971](https://github.com/tobua/synec/commit/26d697118458250a488de86600b40c19ac8883aa))
* **scripts:** make sure watch doesn't override initial files ([d7a2b94](https://github.com/tobua/synec/commit/d7a2b94a5a18fe7fe06b7bb162ae746825bf1864))
* **update:** fix breaking change in schema-utils ([1a68ebf](https://github.com/tobua/synec/commit/1a68ebfff94b5b71ae2ef12a013bef47ef3f6eb2))

### [0.1.8](https://github.com/tobua/synec/compare/v0.1.7...v0.1.8) (2020-10-21)


### Features

* **hash:** hash installed plugin to avoid unnecessary installs ([6be4b64](https://github.com/tobua/synec/commit/6be4b64f3865c8daa75fe948ea907ed9807c6959))
* **install:** install or upgrade dependencies before installing plugin ([7417214](https://github.com/tobua/synec/commit/7417214cbf994425477ff8ebbca97f0f6754e695))
* **scripts:** integrate scripts feature into cli and plugin ([3e27706](https://github.com/tobua/synec/commit/3e27706eb5182f17b64bf2a7c16cc8be9fe6eef4))
* **scripts:** run plugin scripts before install and improve tests ([b55a1d8](https://github.com/tobua/synec/commit/b55a1d8560ac9073c0dbccca06c54aeef2580c6b))


### Bug Fixes

* **cli:** exit in these cases should be successful ([371de65](https://github.com/tobua/synec/commit/371de6524a5334e17b95d95d7b2688797e6e6729))
* **scripts:** improve integration of recent changes ([217f65f](https://github.com/tobua/synec/commit/217f65f292f79b5de8fb54a1c8a539a108275251))
* **scripts:** pass over spawned watch script to regular console ([d7bef9d](https://github.com/tobua/synec/commit/d7bef9d9343755f44a9ad7fa538973281936f70d))

### [0.1.7](https://github.com/tobua/synec/compare/v0.1.6...v0.1.7) (2020-09-16)


### Features

* **log:** group copy and remove messages ([736025e](https://github.com/tobua/synec/commit/736025e29c7edfd6b90e14cdf673046d4ef9f5df))

### [0.1.6](https://github.com/tobua/synec/compare/v0.1.5...v0.1.6) (2020-09-06)


### Bug Fixes

* **paths:** adapt paths to allow for more complex setups ([66cb8c7](https://github.com/tobua/synec/commit/66cb8c769a6481fd763bc05b863d208a85e5d729))

### [0.1.5](https://github.com/tobua/synec/compare/v0.1.4...v0.1.5) (2020-09-05)

### [0.1.4](https://github.com/tobua/synec/compare/v0.1.3...v0.1.4) (2020-09-01)


### Bug Fixes

* **general:** several small improvements ([745bcb7](https://github.com/tobua/synec/commit/745bcb7b86d7680106becabacffb219e960d30be))

### [0.1.3](https://github.com/tobua/synec/compare/v0.1.2...v0.1.3) (2020-08-28)

### [0.1.2](https://github.com/tobua/synec/compare/v0.1.1...v0.1.2) (2020-08-28)

### [0.1.1](https://github.com/tobua/synec/compare/v0.1.0...v0.1.1) (2020-07-29)


### Bug Fixes

* **watcher:** only watch published files ([66a4f3b](https://github.com/tobua/synec/commit/66a4f3bda487d842f04ba0a12b79e36d14b5c50f))

## 0.1.0 (2020-07-24)


### Features

* **cli:** finish CLI implementation ([674d4f4](https://github.com/tobua/synec/commit/674d4f4b60d6b5f94eb87631e2d1b0fb85a40bd8))
* **cli:** poc how cli functionality could work ([c2306b2](https://github.com/tobua/synec/commit/c2306b2857ade61c1a620d020924d976fe8d6de6))
* **setup:** skeleton and docs for project ([117b094](https://github.com/tobua/synec/commit/117b094035d965388575c3096a5a7995825034ab))
* **webpack-plugin:** add webpack plugin ([c119522](https://github.com/tobua/synec/commit/c11952206d4607a007be2243e7124e252b419671))
* **webpack-plugin:** finalize plugin ([434290a](https://github.com/tobua/synec/commit/434290a6006c569ca3747774a00a52c3bfa34b6e))
* **webpack-plugin:** use npm cli to install ([ae8b2ef](https://github.com/tobua/synec/commit/ae8b2ef7bd8965c95018dbaa7d13f373108ad738))
