import * as ns from '../../namespaces.js'
import { nodeExpArg } from '../../node-expr/compile.js'

function compileIri (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.sparql.iri
  }], async ({ factory }, arg) => {
    return [factory.namedNode(arg.value)]
  })
}

export {
  compileIri
}
