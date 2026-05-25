import TermSet from '@rdfjs/term-set'
import toNT from '@rdfjs/to-ntriples'
import { isTrue } from '../../compare.js'
import * as ns from '../../namespaces.js'
import resolveClasses, { resolveClassesUp } from '../../resolveClasses.js'
import { validateEach } from '../../validation/utils.js'

function compileClosedNode (shape, context) {
  const closedFunc = context.functionRegistry.compile(shape.ptr.out([ns.sh.closed]), context)
  const ignoredPropertiesFunc = context.functionRegistry.compile(shape.ptr.out([ns.sh.ignoredProperties]), context)

  const propertyShapes = shape.ptr.out([ns.sh.property]).map(ptr => context.getShape(ptr, context))

  return {
    node: validateClosedNode(propertyShapes, closedFunc, ignoredPropertiesFunc)
  }
}

function validateClosedNode (propertyShapes, closedFunc, ignoredPropertiesFunc) {
  return async context => {
    const validate = ({ ignoredProperties, properties }) => {
      const notAllowed = context.focusNode.execute({ start: 'subject', end: 'predicate' }).filter(property => {
        if (ignoredProperties.has(property.term)) {
          return false
        }

        return !properties.has(property.term)
      })

      if (notAllowed.length > 0) {
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

    const closedPtr = await closedFunc(context)
    const closedTrue = closedPtr.terms.some(term => isTrue(term))
    const closedByTypes = closedPtr.terms.some(term => ns.sh.ByTypes.equals(term))

    const properties = new TermSet()
    const ignoredProperties = new TermSet()

    if ((closedTrue || closedByTypes) && ignoredPropertiesFunc) {
      const ignoredPropertiesPtr = await ignoredPropertiesFunc(context)

      for (const ignoredProperty of ignoredPropertiesPtr.terms) {
        ignoredProperties.add(ignoredProperty)
      }
    }

    if (closedTrue) {
      for (const propertyShape of propertyShapes) {
        if (await propertyShape.deactivatedFunc(context)) {
          continue
        }

        properties.add(propertyShape.path[0].predicates[0])
      }

      validate({ ignoredProperties, properties })
    }

    if (ns.sh.ByTypes.equals(closedPtr.term)) {
      const types = resolveClassesUp(context.focusNode.out([ns.rdf.type]))
      const shapesAndTypes = [...types, ...context.shape.ptr.node(types).in([ns.sh.targetClass]).terms]
      const typeNodeShapes = context.shape.ptr.node(shapesAndTypes).execute({
        quantifier: 'zeroOrMore',
        start: 'subject',
        end: 'object',
        predicates: [ns.sh.node]
      })
      const typePropertyShapes = typeNodeShapes.out([ns.sh.property]).map(ptr => context.getShape(ptr, context))

      for (const propertyShape of typePropertyShapes) {
        if (await propertyShape.deactivatedFunc(context)) {
          continue
        }

        properties.add(propertyShape.path[0].predicates[0])
      }

      ignoredProperties.add(ns.rdf.type)

      validate({ ignoredProperties, properties })
    }
  }
}

function compileHasValue (shape) {
  const hasValues = new TermSet(shape.ptr.out([ns.sh.hasValue]).terms)

  return {
    node: validateEach([...hasValues].map(hasValue => validateHasValueNode(hasValue))),
    values: validateHasValueValues(hasValues)
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

function validateHasValueValues (hasValues) {
  return context => {
    const result = [...context.values].some(value => hasValues.has(value.term))

    context.test(result, ns.sh.HasValueConstraintComponent, {
      args: { hasValue: [...hasValues] },
      message: [context.factory.literal('Missing expected value {$hasValue}')]
    })
  }
}

function compileIn (shape, context) {
  const valuesFunc = context.functionRegistry.compile(shape.ptr.out([ns.sh.in]), context)

  return {
    node: validateIn(valuesFunc),
    value: validateIn(valuesFunc)
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

function compileRootClass (shape) {
  const rootClassList = shape.ptr.out([ns.sh.rootClass]).map(ptr => validateRootClassProperty(ptr))

  return {
    values: validateEach(rootClassList)
  }
}

function validateRootClassProperty (rootClass) {
  return async context => {
    const subClasses = resolveClasses(rootClass)
    const results = context.values.terms.filter(term => !subClasses.has(term))

    if (results.length === 0) {
      context.debug(ns.sh.RootClassConstraintComponent, {
        value: context.valueOrNode
      })
    }

    for (const result of results) {
      context.test(false, ns.sh.RootClassConstraintComponent, {
        value: context.focusNode.node([result])
      })
    }
  }
}

function compileUniqueValuesFor (shape) {
  const uniqueValuesForList = shape.ptr.out([ns.sh.uniqueValuesFor]).map(ptr => {
    if (ptr.isList()) {
      return validateUniqueValuesForNode([...ptr.list()].map(ptr => ptr.term))
    } else {
      return validateUniqueValuesForNode([ptr.term])
    }
  })

  return {
    nodes: validateEach(uniqueValuesForList)
  }
}

function validateUniqueValuesForNode (uniqueValuesFor) {
  return async context => {
    const keys = new Map()

    for (const focusNode of context.focusNode) {
      const key = uniqueValuesFor.map(property => toNT(focusNode.out([property]).term)).join(' ')

      if (key === '') {
        continue
      }

      if (!keys.has(key)) {
        keys.set(key, [focusNode])
      } else {
        keys.get(key).push(focusNode)
      }
    }

    const nonUniqueKeys = [...keys.entries()].filter(([, nodes]) => nodes.length > 1)

    if (nonUniqueKeys.length === 0) {
      context.debug(ns.sh.UniqueValuesForConstraintComponent)
    }

    for (const [key, nodes] of nonUniqueKeys) {
      for (const value of nodes) {
        context.create({ focusNode: value }).test(false, ns.sh.UniqueValuesForConstraintComponent, {
          args: { key },
          message: [context.factory.literal(`Key ${key} is not unique for {$uniqueValuesFor}`)]
        })
      }
    }
  }
}

export {
  compileClosedNode,
  compileHasValue,
  compileIn,
  compileRootClass,
  compileUniqueValuesFor
}
