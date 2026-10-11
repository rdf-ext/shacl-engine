import { isTrue } from './compare.js'

/**
 * Compiles the sh:deactivated values of a shape or a constraint triple reifier to a function that returns true if
 * the shape or constraint is deactivated for the given context. Node expressions are supported.
 */
function compileDeactivated (deactivated, context) {
  if (deactivated.terms.length === 0) {
    return () => false
  }

  const func = context.functionRegistry.compile(deactivated)

  return async shapeContext => {
    const result = await func(shapeContext)

    return result.terms.some(term => isTrue(term))
  }
}

export default compileDeactivated
