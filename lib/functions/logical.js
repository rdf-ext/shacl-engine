import * as ns from '../namespaces.js'

function compileAnd (funcContext) {
  const rdfFalse = funcContext.factory.literal('false', ns.xsd.boolean)

  return funcContext.compileFunc(ns.sh.and, async ({ factory }, ...args) => {
    let value = true

    for (const arg of args) {
      if (rdfFalse.equals(arg.term)) {
        value = false
        break
      }
    }

    return [factory.literal(value.toString(), ns.xsd.boolean)]
  })
}

function compileNot (funcContext) {
  const rdfFalse = funcContext.factory.literal('false', ns.xsd.boolean)

  return funcContext.compileFunc(ns.sh.not, async ({ factory }, arg) => {
    const value = rdfFalse.equals(arg.term)

    return [factory.literal(value.toString(), ns.xsd.boolean)]
  })
}

function compileOr (funcContext) {
  const rdfFalse = funcContext.factory.literal('false', ns.xsd.boolean)

  return funcContext.compileFunc(ns.sh.or, async ({ factory }, ...args) => {
    let value = false

    for (const arg of args) {
      if (!rdfFalse.equals(arg.term)) {
        value = true
        break
      }
    }

    return [factory.literal(value.toString(), ns.xsd.boolean)]
  })
}

export {
  compileAnd,
  compileNot,
  compileOr
}
