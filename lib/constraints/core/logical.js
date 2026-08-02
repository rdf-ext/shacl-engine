import { every, exactlyOne, some } from '../../async.js'
import * as ns from '../../namespaces.js'
import { validateEach } from '../../validation/utils.js'

function compileAnd (shape, context) {
  const and = [...shape.ptr.out([ns.sh.and])]
    .flatMap(ptr => [...ptr.list()])
    .map(ptr => context.getShape(ptr))

  return {
    node: validateAnd(and),
    value: validateAnd(and)
  }
}

function validateAnd (and) {
  return async context => {
    const results = []

    const result = await every(and, async shape => {
      const childContext = await shape.validateNode(context.create({ child: true }))

      results.push(...childContext.report.results)

      return childContext.report.conforms
    }, context.options.debug || context.options.details)

    context.test(result, ns.sh.AndConstraintComponent, {
      results,
      value: context.valueOrNode
    })
  }
}

function compileNot (shape, context) {
  const notList = shape.ptr.out([ns.sh.not])
    .map(ptr => validateNot(context.getShape(ptr)))

  return {
    node: validateEach(notList),
    value: validateEach(notList)
  }
}

function validateNot (not) {
  return async context => {
    const childContext = await not.validateNode(context.create({ child: true }))

    const result = !childContext.report.conforms

    context.test(result, ns.sh.NotConstraintComponent, {
      args: { not: not.ptr.term },
      message: [context.factory.literal('Value does have shape {$not}')],
      results: childContext.report.results,
      value: context.valueOrNode
    })
  }
}

function compileOr (shape, context) {
  const orList = [...shape.ptr.out([ns.sh.or])]
    .map(ptr => validateOr([...ptr.list()].map(item => context.getShape(item))))

  return {
    node: validateEach(orList),
    value: validateEach(orList)
  }
}

function validateOr (or) {
  return async context => {
    const results = []

    const result = await some(or, async shape => {
      const childContext = await shape.validateNode(context.create({ child: true }))

      results.push(...childContext.report.results)

      return childContext.report.conforms
    }, context.options.debug || context.options.details)

    context.test(result, ns.sh.OrConstraintComponent, {
      results,
      value: context.valueOrNode
    })
  }
}

function compileXone (shape, context) {
  const xoneList = [...shape.ptr.out([ns.sh.xone])]
    .map(ptr => validateXone([...ptr.list()].map(item => context.getShape(item))))

  return {
    node: validateEach(xoneList),
    value: validateEach(xoneList)
  }
}

function validateXone (xone) {
  return async context => {
    const results = []

    const result = await exactlyOne(xone, async shape => {
      const childContext = await shape.validateNode(context.create({ child: true }))

      results.push(...childContext.report.results)

      return childContext.report.conforms
    }, context.options.debug || context.options.details)

    context.test(result, ns.sh.XoneConstraintComponent, {
      results,
      value: context.valueOrNode
    })
  }
}

export {
  compileAnd,
  compileNot,
  compileOr,
  compileXone
}
