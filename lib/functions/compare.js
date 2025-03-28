import * as ns from '../namespaces.js'

function compileEq (funcContext) {
  const argFuncs = funcContext.compileAll(
    funcContext.expression.out([ns.shn.eq]).list())

  return async shapeContext => {
    const arg0 = await argFuncs[0](shapeContext)
    const arg1 = await argFuncs[1](shapeContext)

    let value

    if (!arg0.term) {
      if (!arg1.term) {
        value = true
      } else {
        value = false
      }
    } else {
      value = arg0.term.equals(arg1.term)
    }

    const term = shapeContext.factory.literal(value.toString(), ns.xsd.boolean)

    return shapeContext.focusNode.node([term])
  }
}

export {
  compileEq
}
