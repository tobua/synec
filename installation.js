import semver from 'semver'
import log, { configure } from 'logua'

configure({ name: 'synec', color: 'yellow' })

// Requires node >= 13.2.0 for ES modules.
if (semver.lt(process.version, '13.2.0')) {
  log('Will not work with node < 13.2.0', 'error')
}
