import TermMap from '@rdfjs/term-map'
import ConstraintAnnotations from '../ConstraintAnnotations.js'
import { compileTraversal } from '../constraints/shn/traversal.js'
import * as ns from '../namespaces.js'

const validationSteps = ['node', 'nodes', 'value', 'values']

function bindAnnotation (validation, annotation) {
  if (annotation === ConstraintAnnotations.empty) {
    return validation
  }

  return Object.fromEntries(validationSteps
    .filter(step => validation[step])
    .map(step => [step, async context => {
      if (await annotation.deactivatedFunc(context)) {
        return
      }

      return validation[step](context.create({ annotation }))
    }]))
}

function shapeView (shape, predicate, objects) {
  const ptr = Object.create(shape.ptr)

  ptr.out = (predicates, ...args) => {
    const result = shape.ptr.out(predicates, ...args)

    if (!predicates || !predicates.some(p => p.equals(predicate))) {
      return result
    }

    return result.filter(item => objects.has(item.term))
  }

  return Object.create(shape, {
    ptr: { value: ptr },
    sparql: { get: () => ptr.out([ns.sh.sparql]) }
  })
}

class ConstraintRegistry {
  constructor ({ constraints }) {
    this.constraints = new TermMap(constraints)
  }

  compile (shape, context) {
    const coverage = context.options.coverage

    let propertyValidation = false
    const selected = new Map()

    for (const property of shape.ptr.execute({ start: 'subject', end: 'predicate' })) {
      const result = this.constraints.get(property.term)

      if (result && !selected.has(result)) {
        selected.set(result, property.term)

        if (property.term.equals(ns.sh.property)) {
          propertyValidation = true
        }
      }
    }

    const compiled = []

    for (const [compile, predicate] of selected) {
      for (const { annotation, objects } of shape.annotations.groups(predicate)) {
        const validation = compile(objects ? shapeView(shape, predicate, objects) : shape, context)

        if (validation) {
          compiled.push(bindAnnotation(validation, annotation))
        }
      }
    }

    // for path coverage, add a dummy validation if there is no property validation
    if (coverage && shape.isPropertyShape && !propertyValidation) {
      compiled.push(compileTraversal(shape, context))
    }

    return compiled
  }
}

export default ConstraintRegistry
