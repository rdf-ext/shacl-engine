import * as ns from '../namespaces.js'

function compileNot (funcContext) {
  const argFunc = funcContext.compile(funcContext.expression.out([ns.sh.not]))
  const rdfFalse = funcContext.factory.literal('false', ns.xsd.boolean)

  return async shapeContext => {
    const arg = await argFunc(shapeContext)

    const value = rdfFalse.equals(arg.term)
    const term = shapeContext.factory.literal(value.toString(), ns.xsd.boolean)

    return shapeContext.focusNode.node([term])
  }
}

export {
  compileNot
}
