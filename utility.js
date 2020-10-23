import { join, normalize } from 'path'
import {
  readFileSync,
  readdirSync,
  unlinkSync,
  copyFileSync,
  existsSync,
  writeFileSync,
} from 'fs'
import { execSync, spawn } from 'child_process'
import chokidar from 'chokidar'
import stripAnsi from 'strip-ansi'
import parseIgnore from 'parse-gitignore'
import checkDependencies from 'check-dependencies'
import { hashElement } from 'folder-hash'
import { context } from './utility/context.js'
import { log } from './utility/log.js'

export const getLocalDependencies = () => {
  const { localDependencies } = context.pkg

  if (!localDependencies) {
    return false
  }

  // Only Objects and Arrays
  if (typeof localDependencies !== 'object') {
    return false
  }

  // Array or object needs at least one entry
  if (Array.isArray(localDependencies)) {
    if (localDependencies.length < 1) {
      return false
    }
  } else if (Object.keys(localDependencies).length < 1) {
    return false
  }

  // We only need the paths to the packages
  if (Array.isArray(localDependencies)) {
    return localDependencies
  }

  // Convert object to path array
  return Object.keys(localDependencies).map((name) => localDependencies[name])
}

const appDependenciesInstalled = (packagePath = '') => {
  // TODO install without dependencies will only create a lock file and doesn't even need one.
  const hasNodeModules = existsSync(
    join(process.cwd(), packagePath, 'node_modules')
  )
  const hasLockFile = existsSync(
    join(process.cwd(), packagePath, 'package-lock.json')
  )

  const packageName =
    packagePath !== '' ? context.plugin[packagePath].pkg.name : context.pkg.name

  if (!hasNodeModules || !hasLockFile) {
    log(`Dependencies for ${packageName} not installed: installing`)
    return false
  }

  const { depsWereOk } = checkDependencies.sync({
    packageDir: join(process.cwd(), packagePath),
    verbose: false,
  })

  if (!depsWereOk) {
    log(`Dependencies for ${packageName} out-of-date: reinstalling`)
  }

  return depsWereOk
}

export const installAppDependencies = (packagePath = '') => {
  if (appDependenciesInstalled(packagePath)) {
    return
  }

  execSync(`npm install`, {
    cwd: join(process.cwd(), packagePath),
    // Silences console output.
    stdio: 'ignore',
  })
}

const generateHash = async (packagePath) => {
  const { name } = JSON.parse(
    readFileSync(join(process.cwd(), packagePath, 'package.json'))
  )

  const hashFilePath = join(process.cwd(), 'node_modules', name, '.synec-hash')

  const { hash } = await hashElement(join(process.cwd(), packagePath), {
    folders: {
      exclude: ['node_modules', 'test', '.*'],
    },
    files: {
      include: ['*.js', '**/*.js'],
    },
  })

  writeFileSync(hashFilePath, hash)
}

const packageNeedsUpdate = async (packagePath) => {
  const { name } = JSON.parse(
    readFileSync(join(process.cwd(), packagePath, 'package.json'))
  )

  if (!existsSync(join(process.cwd(), 'node_modules', name))) {
    return true
  }

  const hashFilePath = join(process.cwd(), 'node_modules', name, '.synec-hash')

  const { hash } = await hashElement(join(process.cwd(), packagePath), {
    folders: {
      exclude: ['node_modules', 'test', '.*'],
    },
    files: {
      include: ['*.js', '**/*.js'],
    },
  })

  let cachedHash

  if (existsSync(hashFilePath)) {
    cachedHash = readFileSync(hashFilePath, 'utf8')
  }

  return !cachedHash || cachedHash !== hash
}

const installTarballs = async (pathsToUpdate) => {
  const tarballs = pathsToUpdate
    .map((path) => `$(npm pack ${path} | tail -1)`)
    .join(' ')

  // Will prune unlisted tarballs or dependencies https://github.com/npm/npm/issues/16853
  execSync(`npm install --no-save ${tarballs}`, {
    cwd: process.cwd(),
    // Silences console output.
    stdio: 'ignore',
  })

  // TODO ctrl c, bzw SIGTERM ignored during install.

  readdirSync(process.cwd())
    .filter((filePath) => filePath.endsWith('.tgz'))
    .map((filePath) => unlinkSync(join(process.cwd(), filePath)))

  return Promise.all(pathsToUpdate.map(generateHash))
}

export const installWithoutSave = async (packagePaths) => {
  // Without newline at first, so that this line will be overridden on success.
  process.stdout.write('Installing localDependencies...')

  let pathsToUpdate = await Promise.all(packagePaths.map(packageNeedsUpdate))
  pathsToUpdate = packagePaths.filter((_, index) => pathsToUpdate[index])

  // If one package is out of date we have to install the others again as well
  // otherwise they'll be pruned from node_modules.
  if (pathsToUpdate.length !== 0) {
    await installTarballs(packagePaths)
  }

  // Removes previous log.
  // Jest implements a custom process.stdout without these functions, therefore skip on tests.
  if (process.stdout.clearLine && process.stdout.cursorTo) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
  }

  log('localDependencies installed')
}

const loadAndParseNpmIgnore = (packagePath) => {
  try {
    return parseIgnore(
      readFileSync(join(process.cwd(), packagePath, '.npmignore'), 'utf8')
    )
  } catch (_) {
    // Ignored
    return null
  }
}

const runWatchScript = (name, command, packagePath) => {
  log(`Watching ${name} in background by running "${command}"`)

  const child = exec(
    'npm run watch',
    {
      cwd: join(process.cwd(), packagePath),
    },
    (error, stdout, stderr) => {
      // This will not be called as long as the command is still running.
      if (error) {
        log(error)
      }

      console.log(stdout)
      console.log(stderr)
    }
  )

  // Create custom stream to make sure console not cleared, as 'tsc --watch' would do normally.
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (data) => {
    // This includes ANSI Escape characters, which mess with the rest of the console.
    // Therefore removing them.
    console.log(stripAnsi(data.toString()))
  })

  // Kill watcher after 5 seconds in test environment.
  if (typeof jest !== 'undefined') {
    setTimeout(() => child.kill(), 5000)
  }
}

const runBuildScript = (name, command, packagePath) => {
  log(`Building ${name} by running "${command}"`)

  execSync(command, {
    cwd: join(process.cwd(), packagePath),
    stdio: 'inherit',
  })
}

export const runScripts = (packagePaths, watch) => {
  packagePaths.forEach((packagePath) => {
    const { scripts, name, main } = context.plugin[packagePath].pkg

    if (!scripts) {
      return
    }

    let command = scripts[watch ? 'watch' : 'build']

    // padua for example uses start script to watch build.
    if (watch && !command) {
      command = scripts.start
    }

    if (!command) {
      return
    }

    // Install dependencies possibly required for script if missing.
    installAppDependencies(packagePath)

    if (watch) {
      if (!existsSync(join(process.cwd(), packagePath, main))) {
        log(
          `main file "${main}" missing in package ${name} running a regular build first`
        )
        // Run a regular build first to ensure files are available on initial install.
        runBuildScript(name, scripts.build, packagePath)
      }

      runWatchScript(name, command, packagePath)
    } else {
      runBuildScript(name, command, packagePath)
    }
  })
}

export const getWatchPaths = (packagePath) => {
  // npm dotdir-regex / dotfile-regex
  const dotDirRegex = /(?:^|[\\/])(\.(?!\.)[^\\/]+)[\\/]/
  const dotFileRegex = /(?:^|[\\/])(\.(?!\.)[^\\/]+)$/
  const alwaysIgnored = [/node_modules/, dotDirRegex, dotFileRegex]
  const { files, main, name } = context.plugin[packagePath].pkg
  const npmIgnore = loadAndParseNpmIgnore(packagePath)

  const filesMissing = !files || !Array.isArray(files) || files.length < 1
  const npmIgnoreMissing =
    !npmIgnore || !Array.isArray(npmIgnore) || npmIgnore.length < 1

  if (filesMissing && npmIgnoreMissing) {
    log(
      '"files" entry in package.json or .npmignore file missing. Add it to prevent publishing unnecessary files to npm',
      'warning'
    )
    return ['.', alwaysIgnored, name]
  }

  // package.json and main are always included by npm.
  // README/CHANGELOG files not required for this plugin to work properly.
  let filesToInclude = ['package.json']

  if (main) {
    try {
      filesToInclude.push(normalize(main))
    } catch (_) {
      // Ignore
    }
  }

  let filesToIgnore = []

  // Preferring files over npmignore.
  if (!filesMissing) {
    filesToInclude = filesToInclude.concat(files)
  } else {
    filesToInclude = ['.']
    filesToIgnore = filesToIgnore.concat(npmIgnore)
  }

  filesToIgnore = filesToIgnore.concat(alwaysIgnored)

  return [filesToInclude, filesToIgnore, name]
}

export const watchLocalDependencies = (packagePaths) => {
  const destinationPackages = new Map()
  const watchers = packagePaths.map((packagePath) => {
    const [includedPaths, ignoredPaths, name] = getWatchPaths(packagePath)
    const absolutePackagePath = join(process.cwd(), packagePath)
    const absoluteDestinationPath = join(process.cwd(), `node_modules/${name}`)

    // Used to access destination from different watchers later.
    destinationPackages.set(absolutePackagePath, absoluteDestinationPath)

    return chokidar.watch(includedPaths, {
      // Watching node_modules is unnecessary, dot-stuff should be ignored anyways.
      ignored: ignoredPaths,
      // Files already there have been copied by installation.
      ignoreInitial: true,
      // The packagePath will be the CWD to watch from.
      cwd: absolutePackagePath,
    })
  })

  const copyFile = (from, to, filePath) => {
    log(`Copying ${filePath}`, {
      group: 'copy-synec',
      message: (count) => `Copying ${count} files`,
    })
    try {
      copyFileSync(join(from, filePath), join(to, filePath))
    } catch (_) {
      log(`Copying ${filePath} failed`, 'warning')
    }
  }

  const removeFile = (to, filePath) => {
    log(`Removing ${filePath}`, {
      group: 'remove-synec',
      message: (count) => `Removing ${count} files`,
    })
    try {
      unlinkSync(join(to, filePath))
    } catch (_) {
      log(`Removing ${filePath} failed`, 'warning')
    }
  }

  watchers.forEach((watcher) => {
    const from = watcher.options.cwd
    const to = destinationPackages.get(watcher.options.cwd)
    const copyHandler = copyFile.bind(null, from, to)
    const removeHandler = removeFile.bind(null, to)
    watcher
      .on('add', copyHandler)
      .on('change', copyHandler)
      .on('unlink', removeHandler)
  })

  // Stop watching paths.
  return () => watchers.forEach((watcher) => watcher.close())
}
