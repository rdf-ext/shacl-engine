import TermSet from '@rdfjs/term-set'
import * as ns from './namespaces.js'
import resolveClasses from './resolveClasses.js'

class TargetResolver {
  constructor (shape) {
    this.targetClass = new TermSet([
      ...resolveClasses(shape.ptr.hasOut([ns.rdf.type], [ns.rdfs.Class])),
      ...resolveClasses(shape.ptr.hasOut([ns.rdf.type], [ns.sh.ShapeClass])),
      ...resolveClasses(shape.ptr.hasOut([ns.rdf.type], [ns.sh.NodeShape])),
      ...resolveClasses(shape.ptr.out([ns.sh.targetClass]))
    ])

    this.targetNode = shape.ptr.out([ns.sh.targetNode])
    this.targetObjectsOf = shape.ptr.out([ns.sh.targetObjectsOf]).terms
    this.targetSubjectsOf = shape.ptr.out([ns.sh.targetSubjectsOf]).terms
    this.targetWhere = shape.ptr.out([ns.sh.targetWhere])
  }

  async resolve (context) {
    const any = context.focusNode.node([null])

    const terms = [
      ...context.focusNode.hasOut([ns.rdf.type], this.targetClass).terms,
      ...any.execute({ start: 'object', end: 'object', predicates: this.targetObjectsOf }).terms,
      ...any.execute({ start: 'subject', end: 'subject', predicates: this.targetSubjectsOf }).terms,
      ...any.in([ns.sh.shape]).terms
    ]

    for (const term of this.targetNode) {
      const func = context.functionRegistry.compile(term, context)
      const results = await func(context)

      terms.push(...results.terms)
    }

    for (const targetWhere of this.targetWhere) {
      const shape = context.getShape(targetWhere)
      const focusNodes = new TermSet(context.focusNode.node([null]).in([null]).terms)

      for (const focusNodeTerm of focusNodes) {
        const focusNode = context.focusNode.node([focusNodeTerm])
        const report = (await shape.validateNode(context.create({ child: true, focusNode }))).report

        if (report.conforms) {
          terms.push(focusNodeTerm)
        }
      }
    }

    return context.focusNode.node(new TermSet(terms))
  }
}

export default TargetResolver
