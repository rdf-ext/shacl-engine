import * as ns from '../../namespaces.js'
import { nodeExpArg } from '../../node-expr/compile.js'

function compileEquals (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.sparql.equals
  }], async ({ factory, focusNode }, arg) => {
    let value

    if (!arg.terms[0] || !arg.terms[1]) {
      if (!arg.terms[0] && !arg.terms[1]) {
        value = true
      } else {
        value = false
      }
    } else {
      value = arg.terms[0].equals(arg.terms[1])
    }

    return focusNode.node([factory.literal(value.toString(), ns.xsd.boolean)])
  })
}

export {
  compileEquals
}
