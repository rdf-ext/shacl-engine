import * as ns from '../namespaces.js'

function compileExists (funcContext) {
  const argFunc = funcContext.compile(funcContext.expression.out([ns.shn.exists]))

  return async shapeContext => {
    const arg = await argFunc(shapeContext)
    const term = shapeContext.factory.literal(Boolean(arg.term).toString(), ns.xsd.boolean)

    return shapeContext.focusNode.node([term])
  }
}

export {
  compileExists
}
