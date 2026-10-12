import TermSet from '@rdfjs/term-set'
import { fromRdf } from 'rdf-literal'
import * as ns from '../namespaces.js'

function compileClosedNode (shape) {
  const closed = fromRdf(shape.ptr.out([ns.sh.closed]).term)

  if (!closed) {
    return null
  }

  const propertyShapes = shape.ptr.out([ns.sh.property]).map(ptr => shape.validator.shape(ptr))
  const properties = new TermSet(propertyShapes.filter(shape => !shape.deactivated).map(shape => shape.path[0].predicates[0]))
  const ignoredProperties = new TermSet([...(shape.ptr.out([ns.sh.ignoredProperties]).list() || [])].map(item => item.term))

  return {
    node: validateClosedNode(properties, ignoredProperties)
  }
}

function validateClosedNode (properties, ignoredProperties) {
  return context => {
    const notAllowed = context.focusNode.execute({ start: 'subject', end: 'predicate' }).filter(property => {
      if (ignoredProperties.has(property.term)) {
        return false
      }

      return !properties.has(property.term)
    })

    if (notAllowed.ptrs.length > 0) {
      for (const value of notAllowed) {
        context.violation(ns.sh.ClosedConstraintComponent, {
          message: [context.factory.literal('Predicate is not allowed (closed shape)')],
          path: [{ quantifier: 'one', start: 'subject', end: 'object', predicates: [value.term] }],
          value: context.focusNode.node([[...value.quads()][0].object])
        })
      }
    } else {
      context.debug(ns.sh.ClosedConstraintComponent)
    }
  }
}

function compileHasValue (shape) {
  const hasValueTerms = shape.ptr.out([ns.sh.hasValue]).terms

  return {
    node: validateHasValueNode(hasValueTerms),
    property: validateHasValueProperty(hasValueTerms)
  }
}

function validateHasValueNode (hasValueTerms) {
  return context => {
    for (const hasValue of hasValueTerms) {
      context.test(hasValue.equals(context.valueOrNode.term), ns.sh.HasValueConstraintComponent, {
        args: { hasValue },
        message: [context.factory.literal('Value must be {$hasValue}')]
      })
    }
  }
}

function validateHasValueProperty (hasValueTerms) {
  return context => {
    for (const hasValue of hasValueTerms) {
      const result = [...context.values].some(value => hasValue.equals(value.term))

      context.test(result, ns.sh.HasValueConstraintComponent, {
        args: { hasValue },
        message: [context.factory.literal('Missing expected value {$hasValue}')]
      })
    }
  }
}

function compileIn (shape) {
  const values = new TermSet([...shape.ptr.out([ns.sh.in]).list()].map(item => item.term))

  return {
    generic: validateIn(values)
  }
}

function validateIn (values) {
  return context => {
    context.test(values.has(context.valueOrNode.term), ns.sh.InConstraintComponent, {
      args: { in: [...values].map(v => v.value).join(', ') },
      message: [context.factory.literal('Value is not in {$in}')],
      value: context.valueOrNode
    })
  }
}

export {
  compileClosedNode,
  compileHasValue,
  compileIn
}
