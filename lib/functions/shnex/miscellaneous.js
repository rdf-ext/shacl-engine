import TermSet from '@rdfjs/term-set'
import * as ns from '../../namespaces.js'
import { copyArg, nodeExpArg } from '../../node-expr/compile.js'
import resolveClasses from '../../resolveClasses.js'

function compileInstanceOf (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.instancesOf
  }], async ({ factory, focusNode }, instanceOf) => {
    const resolvedClasses = resolveClasses(instanceOf)

    return focusNode.node(resolvedClasses).in(ns.rdf.type)
  })
}

function compileNodesMatching (funcContext) {
  return funcContext.compile([{
    ...copyArg,
    property: ns.shnex.nodesMatching
  }], async ({ engine, factory, focusNode }, nodesMatching) => {
    const terms = new TermSet()

    const nodes = focusNode.node(new TermSet(focusNode.node([null]).in().terms))

    for (const node of nodes) {
      const report = await engine.validate(node, nodesMatching)

      if (report.conforms) {
        terms.add(node.term)
      }
    }

    return focusNode.node(terms)
  })
}

export {
  compileInstanceOf,
  compileNodesMatching
}
