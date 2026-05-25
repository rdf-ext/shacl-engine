import * as ns from '../../namespaces.js'

function compileMaxCount (shape) {
  const maxCounts = shape.ptr.out([ns.sh.maxCount]).values.map(value => parseInt(value))
  const maxCount = Math.min(...maxCounts)

  return {
    values: validateMaxCountValues(maxCount)
  }
}

function validateMaxCountValues (maxCount) {
  return context => {
    const count = context.values.length

    context.test(count <= maxCount, ns.sh.MaxCountConstraintComponent, {
      args: { count, maxCount },
      message: [context.factory.literal('More than {$maxCount} values')]
    })
  }
}

function compileMinCount (shape) {
  const minCounts = shape.ptr.out([ns.sh.minCount]).values.map(value => parseInt(value))
  const minCount = Math.max(...minCounts)

  return {
    values: validateMinCountValues(minCount)
  }
}

function validateMinCountValues (minCount) {
  return context => {
    const count = context.values.length

    context.test(count >= minCount, ns.sh.MinCountConstraintComponent, {
      args: { count, minCount },
      message: [context.factory.literal('Less than {$minCount} values')]
    })
  }
}

export {
  compileMaxCount,
  compileMinCount
}
