import { every, filter, map, some } from '../../async.js'
import { isTrue } from '../../compare.js'
import * as ns from '../../namespaces.js'
import { validateEach } from '../../validation/utils.js'

function compileNode (shape, context) {
  const node = [...shape.ptr.out([ns.sh.node])].map(ptr => context.getShape(ptr))

  return {
    node: validateNode(node),
    value: validateNode(node)
  }
}

function validateNode (node) {
  return async context => {
    for (const shape of node) {
      const nodeContext = await shape.validateNode(context.create({ child: true, focusNode: context.valueOrNode }))

      context.test(nodeContext.report.conforms, ns.sh.NodeConstraintComponent, {
        args: { node: shape.ptr.term },
        message: [context.factory.literal('Value does not have shape {$node}')],
        results: nodeContext.report.results,
        value: context.valueOrNode
      })
    }
  }
}

function compileNodeByExpression (shape, context) {
  const nodeFunc = context.functionRegistry.compile(shape.ptr.out([ns.sh.nodeByExpression]), context)

  return {
    node: validateNodeByExpression(nodeFunc),
    value: validateNodeByExpression(nodeFunc)
  }
}

function validateNodeByExpression (nodeFunc) {
  return async context => {
    const node = (await nodeFunc(context)).map(ptr => context.getShape(ptr))

    for (const shape of node) {
      const nodeContext = await shape.validateNode(context.create({ child: true, focusNode: context.valueOrNode }))

      context.test(nodeContext.report.conforms, ns.sh.NodeByExpressionConstraintComponent, {
        args: { node: shape.ptr.term },
        message: [context.factory.literal('Value does not have shape {$node}')],
        results: nodeContext.report.results,
        source: [shape.ptr.term],
        value: context.valueOrNode
      })
    }
  }
}

function compileProperty (shape, context) {
  const property = [...shape.ptr.out([ns.sh.property])].map(ptr => context.getShape(ptr))

  return {
    node: validateProperty(property),
    value: validateProperty(property)
  }
}

function validateProperty (property) {
  return async context => {
    const propertyContext = context.create({ focusNode: context.valueOrNode })

    for (const shape of property) {
      await shape.validateNode(propertyContext)
    }
  }
}

function compileQualifiedValueShape (shape, context) {
  const valueShape = context.getShape(shape.ptr.out([ns.sh.qualifiedValueShape]))

  const valueShapesDisjointTerm = shape.ptr.out([ns.sh.qualifiedValueShapesDisjoint]).term
  const valueShapesDisjoint = valueShapesDisjointTerm && isTrue(valueShapesDisjointTerm)

  const maxCountTerm = shape.ptr.out([ns.sh.qualifiedMaxCount]).term
  const maxCount = maxCountTerm ? parseInt(maxCountTerm.value) : null

  const minCountTerm = shape.ptr.out([ns.sh.qualifiedMinCount]).term
  const minCount = minCountTerm ? parseInt(minCountTerm.value) : null

  return {
    values: validateQualifiedValueShape(valueShape, valueShapesDisjoint, maxCount, minCount)
  }
}

function validateQualifiedValueShape (valueShape, valueShapesDisjoint, maxCount, minCount) {
  return async context => {
    const resultsDeep = []
    let siblingShapes = []

    if (valueShapesDisjoint) {
      siblingShapes = new Set(
        context.shape.ptr
          .in([ns.sh.property])
          .out([ns.sh.property])
          .out([ns.sh.qualifiedValueShape])
          .filter(ptr => !ptr.term.equals(valueShape.ptr.term))
          .map(ptr => context.getShape(ptr))
      )
    }

    const count = (await filter(context.values, async value => {
      const valueShapeReport = (await valueShape.validateNode(context.create({ child: true, focusNode: value }))).report

      resultsDeep.push(valueShapeReport.results)

      if (!valueShapeReport.conforms) {
        return false
      }

      if (siblingShapes.length === 0) {
        return true
      }

      if (context.options.debug || context.options.details) {
        // all shapes are processed if debug info or details are requested
        const siblingReports = await map([...siblingShapes], async siblingShape => {
          return (await siblingShape.validate(context.create({ child: true, focusNode: value }))).report
        })

        resultsDeep.push(siblingReports.flatMap(report => report.results))

        return !siblingReports.every(report => report.conforms)
      } else {
        // otherwise, we stop after the first shape does not conform
        return !await every([...siblingShapes], async siblingShape => {
          return (await siblingShape.validateNode(context.create({ child: true, focusNode: value }))).report.conforms
        })
      }
    })).length

    if (maxCount !== null) {
      context.test(count <= maxCount, ns.sh.QualifiedMaxCountConstraintComponent, {
        args: {
          qualifiedMaxCount: maxCount,
          qualifiedValueShape: valueShape.ptr.term,
          qualifiedValueShapesDisjoint: valueShapesDisjoint
        },
        message: [context.factory.literal('More than {$qualifiedMaxCount} values have shape {$qualifiedValueShape}')],
        results: resultsDeep.flat()
      })
    }

    if (minCount !== null) {
      context.test(count >= minCount, ns.sh.QualifiedMinCountConstraintComponent, {
        args: {
          qualifiedMinCount: minCount,
          qualifiedValueShape: valueShape.ptr.term,
          qualifiedValueShapesDisjoint: valueShapesDisjoint
        },
        message: [context.factory.literal('Less than {$qualifiedMinCount} values have shape {$qualifiedValueShape}')],
        results: resultsDeep.flat()
      })
    }
  }
}

function compileSomeValue (shape, context) {
  const validateList = shape.ptr.out([ns.sh.someValue]).map(ptr => validateSomeValue(context.getShape(ptr)))

  return {
    values: validateEach(validateList)
  }
}

function validateSomeValue (shape) {
  return async context => {
    const result = await some(context.values, async value => {
      const childContext = await shape.validateNode(context.create({ child: true, focusNode: value }))

      return childContext.report.conforms
    }, context.options.debug || context.options.details)

    context.test(result, ns.sh.SomeValueConstraintComponent, {
      args: { shape: shape.ptr.term },
      message: [context.factory.literal('No value has shape {$shape}')]
    })
  }
}

export {
  compileNode,
  compileNodeByExpression,
  compileProperty,
  compileQualifiedValueShape,
  compileSomeValue
}
