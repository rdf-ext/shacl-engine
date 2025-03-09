import compareTerms from '../compareTerms.js'
import * as ns from '../namespaces.js'

function compileMaxExclusive (shape) {
  const maxExclusiveFunc = shape.validator.functionRegistry.compile(shape.ptr.out([ns.sh.maxExclusive]))

  return {
    generic: validateMaxExclusive(maxExclusiveFunc)
  }
}

function validateMaxExclusive (maxExclusiveFunc) {
  return async context => {
    const maxExclusivePtr = await maxExclusiveFunc(context)
    const maxExclusive = maxExclusivePtr.term
    const comparison = compareTerms(context.valueOrNode.term, maxExclusive)

    context.test(comparison !== null && comparison < 0, ns.sh.MaxExclusiveConstraintComponent, {
      args: { maxExclusive },
      message: [context.factory.literal('Value is not less than {$maxExclusive}')],
      value: context.valueOrNode
    })
  }
}

function compileMaxInclusive (shape) {
  const maxInclusiveFunc = shape.validator.functionRegistry.compile(shape.ptr.out([ns.sh.maxInclusive]))

  return {
    generic: validateMaxInclusive(maxInclusiveFunc)
  }
}

function validateMaxInclusive (maxInclusiveFunc) {
  return async context => {
    const maxInclusivePtr = await maxInclusiveFunc(context)
    const maxInclusive = maxInclusivePtr.term
    const comparison = compareTerms(context.valueOrNode.term, maxInclusive)

    context.test(comparison !== null && comparison <= 0, ns.sh.MaxInclusiveConstraintComponent, {
      args: { maxInclusive },
      message: [context.factory.literal('Value is not less than or equal to {$maxInclusive}')],
      value: context.valueOrNode
    })
  }
}

function compileMinExclusive (shape) {
  const minExclusiveFunc = shape.validator.functionRegistry.compile(shape.ptr.out([ns.sh.minExclusive]))

  return {
    generic: validateMinExclusive(minExclusiveFunc)
  }
}

function validateMinExclusive (minExclusiveFunc) {
  return async context => {
    const minExclusivePtr = await minExclusiveFunc(context)
    const minExclusive = minExclusivePtr.term
    const comparison = compareTerms(context.valueOrNode.term, minExclusive)

    context.test(comparison !== null && comparison > 0, ns.sh.MinExclusiveConstraintComponent, {
      args: { minExclusive },
      message: [context.factory.literal('Value is not greater than {$minExclusive}')],
      value: context.valueOrNode
    })
  }
}

function compileMinInclusive (shape) {
  const minExclusiveFunc = shape.validator.functionRegistry.compile(shape.ptr.out([ns.sh.minInclusive]))

  return {
    generic: validateMinInclusive(minExclusiveFunc)
  }
}

function validateMinInclusive (minExclusiveFunc) {
  return async context => {
    const minInclusivePtr = await minExclusiveFunc(context)
    const minInclusive = minInclusivePtr.term
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
