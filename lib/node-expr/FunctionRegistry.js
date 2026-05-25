import TermMap from '@rdfjs/term-map'
import { compileEmpty } from '../functions/shnex/basic.js'
import FunctionContext from './FunctionContext.js'

class FunctionRegistry {
  constructor ({ factory, functions }) {
    this.factory = factory
    this.functions = new TermMap(functions)
  }

  compile (expression) {
    if (expression.length === 0) {
      return null
    }

    if (expression.term.termType === 'Literal') {
      return () => expression
    }

    if (expression.term.termType === 'NamedNode') {
      return () => expression
    }

    if (expression.isList()) {
      return () => expression.node([...expression.list()].map(ptr => ptr.term))
    }

    const funcContext = new FunctionContext({
      expression,
      factory: this.factory,
      functionRegistry: this
    })

    const properties = funcContext.expression.execute({ start: 'subject', end: 'predicate' })

    for (const property of properties) {
      const func = this.functions.get(property.term)

      if (func) {
        return func(funcContext)
      }
    }

    if (properties.length === 0) {
      return compileEmpty(funcContext)
    }

    throw new Error(`Unable to compile node expression (${properties.values})`)
  }
}

export default FunctionRegistry
