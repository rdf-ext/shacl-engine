import TermSet from '@rdfjs/term-set'
import * as ns from './namespaces.js'
import resolveClasses from './resolveClasses.js'

class TargetResolver {
  constructor (shape) {
    this.targetClass = new TermSet([
      ...resolveClasses(shape.ptr.hasOut([ns.rdf.type], [ns.sh.NodeShape])),
      ...resolveClasses(shape.ptr.out([ns.sh.targetClass]))
    ])

    this.targetNodeFuncs = shape.validator.functionRegistry.compileAll(shape.ptr.out([ns.sh.targetNode]))
    this.targetObjectsOf = shape.ptr.out([ns.sh.targetObjectsOf]).terms
    this.targetSubjectsOf = shape.ptr.out([ns.sh.targetSubjectsOf]).terms
  }

  async resolve (context) {
    const any = context.focusNode.node([null])

    const targetNodes = []

    for (const targetNodeFunc of this.targetNodeFuncs) {
      targetNodes.push(...(await targetNodeFunc(context)).terms)
    }

    const terms = [
      ...context.focusNode.hasOut([ns.rdf.type], this.targetClass).terms,
      ...targetNodes,
      ...any.execute({ start: 'object', end: 'object', predicates: this.targetObjectsOf }).terms,
      ...any.execute({ start: 'subject', end: 'subject', predicates: this.targetSubjectsOf }).terms
    ]

    return context.focusNode.node(new TermSet(terms))
  }
}

export default TargetResolver
