import toNT from '@rdfjs/to-ntriples'
import * as ns from '../namespaces.js'
import pathsToString from '../pathsToString.js'
import Report from './Report.js'
import Result from './Result.js'
import ValidationContext from './ValidationContext.js'

class ValidationShapeContext extends ValidationContext {
  constructor ({
    shape,
    value,
    valueOrNode,
    valuePaths,
    values,
    ...args
  } = {}) {
    super({ ...args })

    this.shape = shape
    this.value = value
    this.valuePaths = valuePaths
    this.valueOrNode = valueOrNode
    this.values = values
  }

  create ({ child, ...args }) {
    if (child) {
      args.report = new Report({ factory: this.factory, options: this.options })
    }

    return super.create(args)
  }

  id ({ shape = this.shape } = {}) {
    return `${toNT(shape.ptr.term)} - ${toNT(this.focusNode.term)} - ${pathsToString(this.valuePaths)}`
  }

  result (args) {
    const result = new Result({
      factory: this.factory,
      focusNode: this.focusNode,
      shape: this.shape,
      value: this.value,
      valuePaths: this.valuePaths,
      ...args
    })

    const id = this.id()

    if (!this.results.has(id)) {
      this.results.set(id, new Set([result]))
    } else {
      this.results.get(id).add(result)
    }

    this.report.results.push(result)

    return result
  }

  debug (constraintComponent, args) {
    if (this.options.debug) {
      return this.result({ severity: ns.shn.Debug, constraintComponent, ...args })
    }
  }

  trace (constraintComponent, args) {
    if (this.options.trace) {
      return this.result({ severity: ns.shn.Trace, constraintComponent, ...args })
    }
  }

  test (success, constraintComponent, args) {
    if (success) {
      return this.debug(constraintComponent, args)
    } else {
      return this.violation(constraintComponent, args)
    }
  }

  violation (constraintComponent, args) {
    return this.result({
      constraintComponent,
      severity: this.shape.severity || ns.sh.Violation,
      ...args
    })
  }
}

export default ValidationShapeContext
