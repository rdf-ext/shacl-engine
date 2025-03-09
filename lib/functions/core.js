import * as ns from '../namespaces.js'
import parsePath from '../parsePath.js'

function compileIri (funcContext) {
  const argFunc = funcContext.compile(
    funcContext.expression.out([ns.shn.iri]))

  return async shapeContext => {
    const arg = await argFunc(shapeContext)
    const term = shapeContext.factory.namedNode(arg.value)

    return shapeContext.focusNode.node([term])
  }
}

function compilePath (funcContext) {
  const pathPtr = funcContext.expression.out([ns.sh.path])
  const steps = parsePath(pathPtr)

  if (steps) {
    return shapeContext => shapeContext.focusNode.executeAll(steps)
  }

  const argFunc = funcContext.compile(pathPtr)

  return async shapeContext => {
    const arg = await argFunc(shapeContext)

    const steps = arg.map(ptr => {
      return {
        quantifier: 'one',
        start: 'subject',
        end: 'object',
        predicates: ptr.terms
      }
    })

    return shapeContext.focusNode.executeAll(steps)
  }
}

function compileStrdt (funcContext) {
  const argFuncs = funcContext.compileAll(
    funcContext.expression.out([ns.shn.strdt]).list())

  return async shapeContext => {
    const arg0 = await argFuncs[0](shapeContext)
    const arg1 = await argFuncs[1](shapeContext)
    const term = shapeContext.factory.literal(arg0.value, arg1.term)

    return shapeContext.focusNode.node([term])
  }
}

export {
  compileIri,
  compilePath,
  compileStrdt
}
