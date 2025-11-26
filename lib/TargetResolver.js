import TermSet from '@rdfjs/term-set'
import * as ns from './namespaces.js'
import resolveClasses from './resolveClasses.js'
import { select } from './sparql.js'

class TargetResolver {
  constructor (ptr) {
    this.targetClass = new TermSet([
      ...resolveClasses(ptr.hasOut([ns.rdf.type], [ns.sh.NodeShape])),
      ...resolveClasses(ptr.out([ns.sh.targetClass]))
    ])
    this.targetNode = ptr.out([ns.sh.targetNode]).terms
    this.targetObjectsOf = ptr.out([ns.sh.targetObjectsOf]).terms
    this.targetSubjectsOf = ptr.out([ns.sh.targetSubjectsOf]).terms
    
    // Extract SPARQL targets (sh:target with sh:select)
    this.sparqlTargets = []
    for (const targetPtr of ptr.out([ns.sh.target])) {
      const selectQuery = targetPtr.out([ns.sh.select]).value
      if (selectQuery) {
        this.sparqlTargets.push({
          query: selectQuery,
          targetPtr
        })
      }
    }
  }

  async resolve (context) {
    const any = context.focusNode.node([null])

    // Synchronous targets (existing Core SHACL targets)
    const ptrs = [
      ...context.focusNode.hasOut([ns.rdf.type], this.targetClass).ptrs,
      ...context.focusNode.node(this.targetNode).ptrs,
      ...any.execute({ start: 'object', end: 'object', predicates: this.targetObjectsOf }).ptrs,
      ...any.execute({ start: 'subject', end: 'subject', predicates: this.targetSubjectsOf }).ptrs
    ]

    // SPARQL targets (new - asynchronous)
    for (const sparqlTarget of this.sparqlTargets) {
      try {
        const sparqlPtrs = await this.executeSparqlTarget(sparqlTarget, context)
        ptrs.push(...sparqlPtrs)
      } catch (error) {
        // Log error but continue with other targets
        console.error('Error executing SPARQL target:', error.message)
      }
    }

    const resolved = context.focusNode.clone({ ptrs })

    return resolved.node([...new TermSet(resolved.terms)])
  }

  async executeSparqlTarget (sparqlTarget, context) {
    const { query } = sparqlTarget

    try {
      // Execute SPARQL SELECT query with empty bindings
      const bindingsArray = await select({
        dataset: context.focusNode.dataset,
        factory: context.factory,
        query,
        bindings: [] // Empty array instead of Map
      })

      // Extract the ?this variable from results and convert to ptrs
      const terms = []
      const thisVar = context.factory.variable('this')
      
      for (const binding of bindingsArray) {
        const thisTerm = binding.get(thisVar)
        if (thisTerm) {
          terms.push(thisTerm)
        }
      }

      // Convert terms to ptr format
      return context.focusNode.node(terms).ptrs
    } catch (error) {
      throw new Error(`SPARQL target query failed: ${error.message}`)
    }
  }
}

export default TargetResolver
