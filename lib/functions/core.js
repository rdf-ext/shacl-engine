import * as ns from '../namespaces.js'
import FunctionBuilder from '../node-expr/compile.js'

function compileIri (funcContext) {
  return funcContext.compile([{
    compile: FunctionBuilder.compileNodeEx,
    property: ns.shn.iri
  }], async ({ factory }, arg) => {
    return [factory.namedNode(arg.value)]
  })
}

function compileStrdt (funcContext) {
  return funcContext.compileFunc(ns.shn.strdt, async ({ factory }, arg0, arg1) => {
    return [factory.literal(arg0.value, arg1.term)]
  })
}

export {
  compileIri,
  compileStrdt
}
