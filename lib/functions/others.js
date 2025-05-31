import * as ns from '../namespaces.js'

function compileExists (funcContext) {
  return funcContext.compileFunc(ns.shn.exists, async ({ factory }, arg) => {
    return [factory.literal(Boolean(arg.term).toString(), ns.xsd.boolean)]
  })
}

export {
  compileExists
}
