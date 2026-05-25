import TermMap from '@rdfjs/term-map'
import { compileTraversal } from '../constraints/shn/traversal.js'
import * as ns from '../namespaces.js'

class ConstraintRegistry {
  constructor ({ constraints }) {
    this.constraints = new TermMap(constraints)
  }

  compile (shape, context) {
    const coverage = context.options.coverage

    let propertyValidation = false
    const selected = new Set()

    for (const property of shape.ptr.execute({ start: 'subject', end: 'predicate' })) {
      const result = this.constraints.get(property.term)

      if (result) {
        selected.add(result)

        if (property.term.equals(ns.sh.property)) {
          propertyValidation = true
        }
      }
    }

    // for path coverage, add a dummy validation if there is no property validation
    if (coverage && shape.isPropertyShape && !propertyValidation) {
      selected.add(compileTraversal)
    }

    return [...selected].map(selected => selected(shape, context)).filter(Boolean)
  }
}

export default ConstraintRegistry
