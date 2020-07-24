import semver from 'semver'

// Requires node >= 13.2.0 for ES modules.
if (semver.lt(process.version, '13.2.0')) {
  console.error('synec: Will not work with node < 13.2.0.')
}
