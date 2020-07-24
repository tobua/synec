export const getOptions = () => {
  const scripts = process.argv
  const options = {
    watch: true,
    production: false,
  }

  if (scripts.includes('--no-watch')) {
    options.watch = false
  }

  if (scripts.includes('--production')) {
    options.production = true
  }

  return options
}
