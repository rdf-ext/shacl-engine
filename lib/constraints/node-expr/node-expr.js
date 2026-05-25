import TermMap from '@rdfjs/term-map'
import { isTrue } from '../../compare.js'
import * as ns from '../../namespaces.js'

function compileExpression (shape, context) {
  const expressionFunc = context.functionRegistry.compile(shape.ptr.out([ns.sh.expression]), context)

  return {
    node: validateExpression(expressionFunc),
    value: validateExpression(expressionFunc)
  }
}

function validateExpression (expressionFunc) {
  return async context => {
    const expression = await expressionFunc(context)

    context.test(isTrue(expression.term), ns.sh.ExpressionConstraintComponent, {
      args: { expression: expression.value },
      message: [context.factory.literal('Expression is {$expression}, expected true')],
      source: [expression.term],
      value: context.valueOrNode
    })
  }
}

const constraints = new TermMap([
  [ns.sh.expression, compileExpression]
])

export {
  constraints as default,
  compileExpression
}
