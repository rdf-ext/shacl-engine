import TermSet from '@rdfjs/term-set'
import { fromRdf } from 'rdf-literal'
import * as ns from '../namespaces.js'

function compileClosedNode (shape) {
  const closedFunc = shape.validator.functionRegistry.compile(shape.ptr.out([ns.sh.closed]))
  const ignoredPropertiesFunc = shape.validator.functionRegistry.compile(shape.ptr.out([ns.sh.ignoredProperties]))

  const propertyShapes = shape.ptr.out([ns.sh.property]).map(ptr => shape.validator.shape(ptr))

  return {
    node: validateClosedNode(propertyShapes, closedFunc, ignoredPropertiesFunc)
  }
}

function validateClosedNode (propertyShapes, closedFunc, ignoredPropertiesFunc) {
  return async context => {
    const closedPtr = await closedFunc(context)
    const closed = fromRdf(closedPtr.term)

    if (!closed) {
      return
    }

    const properties = new TermSet()

    for (const propertyShape of propertyShapes) {
      if (await propertyShape.deactivatedFunc(context)) {
        continue
      }

      properties.add(propertyShape.path[0].predicates[0])
    }

    let ignoredProperties = new TermSet()

    if (ignoredPropertiesFunc) {
      const ignoredPropertiesPtr = await ignoredPropertiesFunc(context)

      ignoredProperties = new TermSet(ignoredPropertiesPtr.terms)
    }

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
  const hasValue = shape.ptr.out([ns.sh.hasValue]).term

  return {
    node: validateHasValueNode(hasValue),
    property: validateHasValueProperty(hasValue)
  }
}

function validateHasValueNode (hasValue) {
  return context => {
    context.test(hasValue.equals(context.valueOrNode.term), ns.sh.HasValueConstraintComponent, {
      args: { hasValue },
      message: [context.factory.literal('Value must be {$hasValue}')]
    })
  }
}

function validateHasValueProperty (hasValue) {
  return context => {
    const result = [...context.values].some(value => hasValue.equals(value.term))

    context.test(result, ns.sh.HasValueConstraintComponent, {
      args: { hasValue },
      message: [context.factory.literal('Missing expected value {$hasValue}')]
    })
  }
}

function compileIn (shape) {
  const valuesFunc = shape.validator.functionRegistry.compile(shape.ptr.out([ns.sh.in]))

  return {
    generic: validateIn(valuesFunc)
  }
}

function validateIn (valuesFunc) {
  return async context => {
    const values = await valuesFunc(context)
    const valuesSet = new TermSet(values.terms)

    context.test(valuesSet.has(context.valueOrNode.term), ns.sh.InConstraintComponent, {
      args: { in: [...valuesSet].map(v => v.value).join(', ') },
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
