import TermSet from '@rdfjs/term-set'
import * as ns from './namespaces.js'
import resolveClasses from './resolveClasses.js'

class TargetResolver {
  constructor (ptr) {
    this.targetClass = new TermSet([
      ...resolveClasses(ptr.hasOut([ns.rdf.type], [ns.sh.NodeShape])),
      ...resolveClasses(ptr.out([ns.sh.targetClass]))
    ])
    this.targetNode = ptr.out([ns.sh.targetNode]).terms
    this.targetObjectsOf = ptr.out([ns.sh.targetObjectsOf]).terms
    this.targetSubjectsOf = ptr.out([ns.sh.targetSubjectsOf]).terms
  }

  resolve (context) {
    const any = context.focusNode.node([null])

    const ptrs = [
      ...context.focusNode.hasOut([ns.rdf.type], this.targetClass).ptrs,
      ...context.focusNode.node(this.targetNode).ptrs,
      ...any.execute({ start: 'object', end: 'object', predicates: this.targetObjectsOf }).ptrs,
      ...any.execute({ start: 'subject', end: 'subject', predicates: this.targetSubjectsOf }).ptrs
    ]

    const resolved = context.focusNode.clone({ ptrs })

    return resolved.node([...new TermSet(resolved.terms)])
  }
}

export default TargetResolver
