import * as ns from '../namespaces.js'

function toRdfDoubleString (num) {
  return num.toExponential().replace('e+', 'E').replace('e', 'E')
}

function compileAdd (funcContext) {
  const argFuncs = funcContext.compileAll(
    funcContext.expression.out([ns.shn.add]).list())

  return async shapeContext => {
    let total = 0

    for (const argFunc of argFuncs) {
      const arg = await argFunc(shapeContext)

      total += parseFloat(arg.value)
    }

    const term = shapeContext.factory.literal(toRdfDoubleString(total), ns.xsd.double)

    return shapeContext.focusNode.node([term])
  }
}

function compileSubtract (funcContext) {
  const argFuncs = funcContext.compileAll(
    funcContext.expression.out([ns.shn.subtract]).list())

  return async shapeContext => {
    const arg0 = await argFuncs[0](shapeContext)

    let total = parseFloat(arg0.value)

    for (const argFunc of argFuncs.slice(1)) {
      const arg = await argFunc(shapeContext)

      total -= parseFloat(arg.value)
    }

    const term = shapeContext.factory.literal(toRdfDoubleString(total), ns.xsd.double)

    return shapeContext.focusNode.node([term])
  }
}

export {
  compileAdd,
  compileSubtract
}
