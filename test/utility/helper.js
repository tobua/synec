export const wait = (time) =>
  new Promise((done) => setTimeout(done, time * 1000))

export const killWatchers = (watchers) =>
  watchers.forEach((killWatcher) => killWatcher())
