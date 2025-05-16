import * as ns from '../namespaces.js'

function compileAnd (funcContext) {
  const argFuncs = funcContext.compileAll(funcContext.expression.out([ns.sh.and]).list())
  const rdfFalse = funcContext.factory.literal('false', ns.xsd.boolean)

  return async shapeContext => {
    let value = true

    for (const argFunc of argFuncs) {
      const arg = await argFunc(shapeContext)

      if (rdfFalse.equals(arg.term)) {
        value = false
        break
      }
    }

    const term = shapeContext.factory.literal(value.toString(), ns.xsd.boolean)

    return shapeContext.focusNode.node([term])
  }
}

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

function compileOr (funcContext) {
  const argFuncs = funcContext.compileAll(funcContext.expression.out([ns.sh.or]).list())
  const rdfFalse = funcContext.factory.literal('false', ns.xsd.boolean)

  return async shapeContext => {
    let value = false

    for (const argFunc of argFuncs) {
      const arg = await argFunc(shapeContext)

      if (!rdfFalse.equals(arg.term)) {
        value = true
        break
      }
    }

    const term = shapeContext.factory.literal(value.toString(), ns.xsd.boolean)

    return shapeContext.focusNode.node([term])
  }
}

export {
  compileAnd,
  compileNot,
  compileOr
}
