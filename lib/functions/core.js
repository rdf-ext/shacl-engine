import * as ns from '../namespaces.js'
import parsePath from '../parsePath.js'

function compileIri (funcContext) {
  return funcContext.compileFunc(ns.shn.iri, async ({ factory }, arg) => {
    return [factory.namedNode(arg.value)]
  })
}

function compilePath (funcContext) {
  const pathPtr = funcContext.expression.out([ns.sh.path])
  const steps = parsePath(pathPtr)

  if (steps) {
    return shapeContext => shapeContext.focusNode.executeAll(steps)
  }

  return funcContext.compileFunc(ns.sh.path, async ({ factory, focusNode }, arg) => {
    const steps = arg.map(ptr => {
      return {
        quantifier: 'one',
        start: 'subject',
        end: 'object',
        predicates: ptr.terms
      }
    })

    return focusNode.executeAll(steps).terms
  })
}

function compileStrdt (funcContext) {
  return funcContext.compileFunc(ns.shn.strdt, async ({ factory }, arg0, arg1) => {
    return [factory.literal(arg0.value, arg1.term)]
  })
}

export {
  compileIri,
  compilePath,
  compileStrdt
}
