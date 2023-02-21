import * as ns from './namespaces.js'
import Report from './Report.js'
import Result from './Result.js'

class Context {
  constructor ({
    factory,
    focusNode,
    options = { debug: false, details: false },
    report = new Report({ factory, options }),
    shape,
    value,
    valueOrNode,
    valuePaths,
    values
  } = {}) {
    this.factory = factory
    this.focusNode = focusNode
    this.options = options
    this.report = report
    this.shape = shape
    this.value = value
    this.valuePaths = valuePaths
    this.valueOrNode = valueOrNode
    this.values = values
  }

  create ({
    child,
    focusNode = this.focusNode,
    shape = this.shape,
    value = this.value,
    valueOrNode = this.valueOrNode,
    valuePaths = this.valuePaths,
    values = this.values
  } = {}) {
    return new Context({
      factory: this.factory,
      focusNode,
      options: this.options,
      report: child ? new Report({ factory: this.factory, options: this.options }) : this.report,
      shape,
      value,
      valueOrNode,
      valuePaths,
      values
    })
  }

  result (args) {
    this.report.results.push(new Result({
      factory: this.factory,
      focusNode: this.focusNode,
      shape: this.shape,
      value: this.value,
      valuePaths: this.valuePaths,
      ...args
    }))
  }

  debug (constraintComponent, args) {
    if (this.options.debug) {
      this.result({ severity: ns.shn.Debug, constraintComponent, ...args })
    }
  }

  trace (constraintComponent, args) {
    if (this.options.trace) {
      this.result({ severity: ns.shn.Trace, constraintComponent, ...args })
    }
  }

  test (success, constraintComponent, args) {
    if (success) {
      this.debug(constraintComponent, args)
    } else {
      this.violation(constraintComponent, args)
    }
  }

  violation (constraintComponent, args) {
    this.result({
      constraintComponent,
      severity: this.shape.severity || ns.sh.Violation,
      ...args
    })
  }
}

export default Context
