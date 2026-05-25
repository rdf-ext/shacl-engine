import * as ns from '../../namespaces.js'

function compileTraversal () {
  return {
    node: validateTraversal(),
    value: validateTraversal()
  }
}

function validateTraversal () {
  return context => {
    context.trace(ns.shn.TraversalConstraintComponent, {
      args: {},
      message: [context.factory.literal('Traversal')],
      value: context.valueOrNode
    })
  }
}

export {
  compileTraversal
}
