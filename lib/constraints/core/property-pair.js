import TermSet from '@rdfjs/term-set'
import { compareTerms, ptrTermEquals } from '../../compare.js'
import * as ns from '../../namespaces.js'
import parsePath from '../../parsePath.js'
import { validateEach } from '../../validation/utils.js'

function compileDisjoint (shape) {
  const validateList = shape.ptr.out([ns.sh.disjoint]).map(ptr => validateDisjoint(parsePath(ptr)))

  return {
    node: validateEach(validateList),
    value: validateEach(validateList)
  }
}

function validateDisjoint (disjointSteps) {
  return context => {
    const results = new TermSet(context.focusNode.executeAll(disjointSteps).terms)
    const matches = results.has(context.valueOrNode.term)

    context.test(!matches, ns.sh.DisjointConstraintComponent, {
      args: { disjoint: [...results] },
      message: [context.factory.literal('Value node must not also be one of the values of {$disjoint}')],
      value: context.valueOrNode
    })
  }
}

function compileEquals (shape) {
  const equalsSteps = parsePath(shape.ptr.out([ns.sh.equals]))

  return {
    node: validateEqualsNode(equalsSteps),
    values: validateEqualsValues(equalsSteps)
  }
}

function validateEqualsNode (equalsSteps) {
  return context => {
    const otherNodes = context.focusNode.executeAll(equalsSteps)
    const missingNodes = otherNodes.filter(ptr => !ptrTermEquals(ptr, context.focusNode))

    if (otherNodes.length === 0) {
      context.violation(ns.sh.EqualsConstraintComponent, {
        args: { otherNode: otherNodes },
        message: [context.factory.literal('Must have same values as {otherNode}')],
        value: context.focusNode
      })
    } else if (missingNodes.length !== 0) {
      for (const missingNode of missingNodes) {
        context.violation(ns.sh.EqualsConstraintComponent, {
          args: { otherNode: otherNodes },
          message: [context.factory.literal('Must have same values as {otherNode}')],
          value: missingNode
        })
      }
    } else {
      context.debug(ns.sh.EqualsConstraintComponent, {
        args: { otherNode: otherNodes },
        message: [context.factory.literal('Must have same values as {otherNode}')]
      })
    }
  }
}

function validateEqualsValues (equalsSteps) {
  return context => {
    const otherNodes = new TermSet(context.focusNode.executeAll(equalsSteps).terms)
    const values = new TermSet(context.values.terms)
    const missingOthers = [...values].filter(term => !otherNodes.has(term))
    const missingValues = [...otherNodes].filter(term => !values.has(term))
    const differences = [...missingOthers, ...missingValues]

    for (const value of differences) {
      context.violation(ns.sh.EqualsConstraintComponent, {
        args: { otherNode: [...otherNodes] },
        message: [context.factory.literal('Must have same values as {$otherNode}')],
        value: context.focusNode.node([value])
      })
    }

    if (differences.length === 0) {
      context.debug(ns.sh.EqualsConstraintComponent, {
        args: { otherNode: [...otherNodes] },
        message: [context.factory.literal('Must have same values as {$otherNode}')]
      })
    }
  }
}

function compileLessThan (shape) {
  const lessThanSteps = parsePath(shape.ptr.out([ns.sh.lessThan]))

  return {
    values: validateLessThan(lessThanSteps)
  }
}

function validateLessThan (lessThanSteps) {
  return context => {
    const lessThanTerms = context.focusNode.executeAll(lessThanSteps).terms

    for (const value of context.values) {
      for (const lessThan of lessThanTerms) {
        const c = compareTerms(value.term, lessThan)

        if (c === null || c >= 0) {
          context.violation(ns.sh.LessThanConstraintComponent, {
            args: { lessThan },
            message: [context.factory.literal('Value is not less than value of {$lessThan}')],
            value
          })
        } else {
          context.debug(ns.sh.LessThanConstraintComponent, {
            args: { lessThan },
            message: [context.factory.literal('Value is not less than value of {$lessThan}')],
            value
          })
        }
      }
    }
  }
}

function compileLessThanOrEquals (shape) {
  const lessThanOrEqualsSteps = parsePath(shape.ptr.out([ns.sh.lessThanOrEquals]))

  return {
    values: validateLessThanOrEquals(lessThanOrEqualsSteps)
  }
}

function validateLessThanOrEquals (lessThanOrEqualsSteps) {
  return context => {
    const lessThanOrEqualsTerms = context.focusNode.executeAll(lessThanOrEqualsSteps).terms

    for (const value of context.values) {
      for (const lessThanOrEquals of lessThanOrEqualsTerms) {
        const c = compareTerms(value.term, lessThanOrEquals)

        if (c === null || c > 0) {
          context.violation(ns.sh.LessThanOrEqualsConstraintComponent, {
            args: { lessThanOrEquals },
            message: [context.factory.literal('Value is not less than or equal to value of {$lessThanOrEquals}')],
            value
          })
        } else {
          context.debug(ns.sh.LessThanOrEqualsConstraintComponent, {
            args: { lessThanOrEquals },
            message: [context.factory.literal('Value is not less than or equal to value of {$lessThanOrEquals}')],
            value
          })
        }
      }
    }
  }
}

function compileSubsetOf (shape) {
  const validateList = shape.ptr.out([ns.sh.subsetOf]).map(ptr => validateSubsetOf(parsePath(ptr)))

  return {
    values: validateEach(validateList)
  }
}

function validateSubsetOf (subsetOfSteps) {
  return context => {
    const otherNodes = new TermSet(context.focusNode.executeAll(subsetOfSteps).terms)

    for (const value of context.values) {
      const isSubset = otherNodes.has(value.term)

      context.test(isSubset, ns.sh.SubsetOfConstraintComponent, {
        args: { otherNodes: [...otherNodes] },
        message: [context.factory.literal('Value is not a subset of values of {$otherNodes}')],
        value
      })
    }
  }
}

export {
  compileDisjoint,
  compileEquals,
  compileLessThan,
  compileLessThanOrEquals,
  compileSubsetOf
}
