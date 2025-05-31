import * as ns from '../namespaces.js'

function toRdfDoubleString (num) {
  return num.toExponential().replace('e+', 'E').replace('e', 'E')
}

function compileAdd (funcContext) {
  return funcContext.compileFunc(ns.shn.add, async ({ factory }, ...args) => {
    let total = 0

    for (const arg of args) {
      total += parseFloat(arg.value)
    }

    return [factory.literal(toRdfDoubleString(total), ns.xsd.double)]
  })
}

function compileSubtract (funcContext) {
  return funcContext.compileFunc(ns.shn.subtract, async ({ factory }, arg0, ...args) => {
    let total = parseFloat(arg0.value)

    for (const arg of args) {
      total -= parseFloat(arg.value)
    }

    return [factory.literal(toRdfDoubleString(total), ns.xsd.double)]
  })
}

export {
  compileAdd,
  compileSubtract
}
