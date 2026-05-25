import Context from '../Context.js'
import Report from './Report.js'

class ValidationContext extends Context {
  constructor ({
    factory,
    options,
    processed = new Set(),
    report = new Report({ factory, options }),
    results = new Map(),
    ...args
  }) {
    super({ factory, options, ...args })

    this.processed = processed
    this.report = report
    this.results = results
  }
}

export default ValidationContext
