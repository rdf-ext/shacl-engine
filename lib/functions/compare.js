import compareTerms from '../compareTerms.js'
import * as ns from '../namespaces.js'

function compileCompare (funcContext, property, func) {
  return funcContext.compileFunc(property, async ({ factory }, arg0, arg1) => {
    if (!arg0.term || !arg1.term) {
      return [factory.literal('false', ns.xsd.boolean)]
    }

    return [factory.literal(func(compareTerms(arg0.term, arg1.term)), ns.xsd.boolean)]
  })
}

function compileEq (funcContext) {
  return funcContext.compileFunc(ns.shn.eq, async ({ factory }, arg0, arg1) => {
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

    return [factory.literal(value.toString(), ns.xsd.boolean)]
  })
}

function compileGt (funcContext) {
  return compileCompare(funcContext, ns.shn.gt, c => c !== null && c > 0)
}

function compileGte (funcContext) {
  return compileCompare(funcContext, ns.shn.gte, c => c !== null && c >= 0)
}

function compileLt (funcContext) {
  return compileCompare(funcContext, ns.shn.lt, c => c !== null && c < 0)
}

function compileLte (funcContext) {
  return compileCompare(funcContext, ns.shn.lte, c => c !== null && c <= 0)
}

export {
  compileEq,
  compileGt,
  compileGte,
  compileLt,
  compileLte
}
