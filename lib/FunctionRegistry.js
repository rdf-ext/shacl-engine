import TermMap from '@rdfjs/term-map'
import FunctionContext from './FunctionContext.js'

class FunctionRegistry {
  constructor (functions) {
    this.functions = new TermMap(functions)
  }

  compile (expression) {
    if (expression.ptrs.length === 0) {
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
      functionRegistry: this
    })

    const properties = funcContext.expression.execute({ start: 'subject', end: 'predicate' })

    for (const property of properties) {
      const func = this.functions.get(property.term)

      if (func) {
        return func(funcContext)
      }
    }

    throw new Error(`Unable to compile node expression (${properties.values})`)
  }

  compileAll (expressions) {
    return [...expressions].map(expression => {
      return this.compile(expression)
    })
  }
}

export default FunctionRegistry
