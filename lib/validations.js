import TermMap from '@rdfjs/term-map'
import { fromRdf } from 'rdf-literal'
import * as ns from './namespaces.js'
import { compileMaxCount, compileMinCount } from './validations/cardinality.js'
import { compileAnd, compileNot, compileOr, compileXone } from './validations/logical.js'
import { compileClosedNode, compileHasValue, compileIn } from './validations/other.js'
import { compileDisjoint, compileEquals, compileLessThan, compileLessThanOrEquals } from './validations/pair.js'
import { compileMaxExclusive, compileMaxInclusive, compileMinExclusive, compileMinInclusive } from './validations/range.js'
import { compileNode, compileProperty, compileQualifiedShape } from './validations/shape.js'
import { compileLanguageIn, compileMaxLength, compileMinLength, compilePattern, compileUniqueLang } from './validations/string.js'
import { compileTraversal } from './validations/traversal.js'
import { compileClass, compileDatatype, compileNodeKind } from './validations/type.js'

class Registry {
  constructor (validations) {
    this.validations = validations
  }

  compile (shape) {
    const coverage = shape.validator.options.coverage
    const deactivatedTerm = shape.ptr.out([ns.sh.deactivated]).term

    // ignore deactivated shape
    if (deactivatedTerm && fromRdf(deactivatedTerm)) {
      return []
    }

    let propertyValidation = false
    const selected = new Set()

    for (const property of shape.ptr.execute({ start: 'subject', end: 'predicate' })) {
      const result = this.validations.get(property.term)

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

    return [...selected].map(selected => selected(shape)).filter(Boolean)
  }
}

const registry = new Registry(new TermMap([
  [ns.sh.maxCount, compileMaxCount],
  [ns.sh.minCount, compileMinCount],

  [ns.sh.and, compileAnd],
  [ns.sh.not, compileNot],
  [ns.sh.or, compileOr],
  [ns.sh.xone, compileXone],

  [ns.sh.closed, compileClosedNode],
  [ns.sh.hasValue, compileHasValue],
  [ns.sh.in, compileIn],

  [ns.sh.disjoint, compileDisjoint],
  [ns.sh.equals, compileEquals],
  [ns.sh.lessThan, compileLessThan],
  [ns.sh.lessThanOrEquals, compileLessThanOrEquals],

  [ns.sh.maxExclusive, compileMaxExclusive],
  [ns.sh.maxInclusive, compileMaxInclusive],
  [ns.sh.minExclusive, compileMinExclusive],
  [ns.sh.minInclusive, compileMinInclusive],

  [ns.sh.node, compileNode],
  [ns.sh.property, compileProperty],
  [ns.sh.qualifiedValueShape, compileQualifiedShape],

  [ns.sh.languageIn, compileLanguageIn],
  [ns.sh.maxLength, compileMaxLength],
  [ns.sh.minLength, compileMinLength],
  [ns.sh.pattern, compilePattern],
  [ns.sh.uniqueLang, compileUniqueLang],

  [ns.sh.class, compileClass],
  [ns.sh.datatype, compileDatatype],
  [ns.sh.nodeKind, compileNodeKind]
]))

export {
  registry
}
