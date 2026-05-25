import { compareTerms } from '../../compare.js'
import * as ns from '../../namespaces.js'

async function funcsToSortedTerms (funcs, context) {
  const ptrs = await Promise.all(funcs.map(func => func(context)))
  const terms = ptrs.map(ptr => ptr.term).sort(compareTerms)

  return terms
}

function compileMaxExclusive (shape, context) {
  const maxExclusiveFuncs = shape.ptr.out([ns.sh.maxExclusive]).map(value => context.functionRegistry.compile(value, context))

  return {
    node: validateMaxExclusive(maxExclusiveFuncs),
    value: validateMaxExclusive(maxExclusiveFuncs)
  }
}

function validateMaxExclusive (maxExclusiveFuncs) {
  return async context => {
    const maxExclusive = (await funcsToSortedTerms(maxExclusiveFuncs, context))[0]
    const comparison = compareTerms(context.valueOrNode.term, maxExclusive)

    context.test(comparison !== null && comparison < 0, ns.sh.MaxExclusiveConstraintComponent, {
      args: { maxExclusive },
      message: [context.factory.literal('Value is not less than {$maxExclusive}')],
      value: context.valueOrNode
    })
  }
}

function compileMaxInclusive (shape, context) {
  const maxInclusiveFuncs = shape.ptr.out([ns.sh.maxInclusive]).map(value => context.functionRegistry.compile(value, context))

  return {
    node: validateMaxInclusive(maxInclusiveFuncs),
    value: validateMaxInclusive(maxInclusiveFuncs)
  }
}

function validateMaxInclusive (maxInclusiveFuncs) {
  return async context => {
    const maxInclusive = (await funcsToSortedTerms(maxInclusiveFuncs, context))[0]
    const comparison = compareTerms(context.valueOrNode.term, maxInclusive)

    context.test(comparison !== null && comparison <= 0, ns.sh.MaxInclusiveConstraintComponent, {
      args: { maxInclusive },
      message: [context.factory.literal('Value is not less than or equal to {$maxInclusive}')],
      value: context.valueOrNode
    })
  }
}

function compileMinExclusive (shape, context) {
  const minExclusiveFuncs = shape.ptr.out([ns.sh.minExclusive]).map(value => context.functionRegistry.compile(value, context))

  return {
    node: validateMinExclusive(minExclusiveFuncs),
    value: validateMinExclusive(minExclusiveFuncs)
  }
}

function validateMinExclusive (minExclusiveFunc) {
  return async context => {
    const minExclusive = (await funcsToSortedTerms(minExclusiveFunc, context)).slice(-1)[0]
    const comparison = compareTerms(context.valueOrNode.term, minExclusive)

    context.test(comparison !== null && comparison > 0, ns.sh.MinExclusiveConstraintComponent, {
      args: { minExclusive },
      message: [context.factory.literal('Value is not greater than {$minExclusive}')],
      value: context.valueOrNode
    })
  }
}

function compileMinInclusive (shape, context) {
  const minExclusiveFuncs = shape.ptr.out([ns.sh.minInclusive]).map(value => context.functionRegistry.compile(value, context))

  return {
    node: validateMinInclusive(minExclusiveFuncs),
    value: validateMinInclusive(minExclusiveFuncs)
  }
}

function validateMinInclusive (minExclusiveFuncs) {
  return async context => {
    const minInclusive = (await funcsToSortedTerms(minExclusiveFuncs, context)).slice(-1)[0]
    const comparison = compareTerms(context.valueOrNode.term, minInclusive)

    context.test(comparison !== null && comparison >= 0, ns.sh.MinInclusiveConstraintComponent, {
      args: { minInclusive },
      message: [context.factory.literal('Value is not greater than or equal to {$minInclusive}')],
      value: context.valueOrNode
    })
  }
}

export {
  compileMaxExclusive,
  compileMaxInclusive,
  compileMinExclusive,
  compileMinInclusive
}
