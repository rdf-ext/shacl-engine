import * as ns from '../../namespaces.js'
import { copyArg, nodeExpArg, nodeExpFuncArg } from '../../node-expr/compile.js'

function compileFindFirst (funcContext) {
  return funcContext.compile([{
    ...copyArg,
    property: ns.shnex.findFirst
  }, {
    ...nodeExpArg,
    property: ns.shnex.nodes
  }], async ({ engine, factory, focusNode }, findFirst, nodes) => {
    if (!nodes) {
      nodes = focusNode
    }

    for (const node of nodes) {
      const report = await engine.validate(node, findFirst)

      if (report.conforms) {
        return focusNode.node([node])
      }
    }

    return focusNode.node([])
  })
}

function compileFlatMap (funcContext) {
  return funcContext.compile([{
    ...nodeExpFuncArg,
    property: ns.shnex.flatMap
  }, {
    ...nodeExpArg,
    property: ns.shnex.nodes
  }], async (shapeContext, flatMap, nodes) => {
    const results = []

    for (const node of nodes) {
      results.push(...(await flatMap({ focusNode: node })).terms)
    }

    return shapeContext.focusNode.node(results)
  })
}

function compileMatchAll (funcContext) {
  return funcContext.compile([{
    ...copyArg,
    property: ns.shnex.matchAll
  }, {
    ...nodeExpArg,
    property: ns.shnex.nodes
  }], async ({ engine, factory, focusNode }, findFirst, nodes) => {
    if (!nodes) {
      nodes = focusNode
    }

    for (const node of nodes) {
      const report = await engine.validate(node, findFirst)

      if (!report.conforms) {
        return focusNode.node([factory.literal('false', ns.xsd.boolean)])
      }
    }

    return focusNode.node([factory.literal('true', ns.xsd.boolean)])
  })
}

export {
  compileFindFirst,
  compileFlatMap,
  compileMatchAll
}
