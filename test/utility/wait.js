export const wait = (time) =>
  new Promise((done) => setTimeout(done, time * 1000))
