import TermMap from '@rdfjs/term-map'
import TermSet from '@rdfjs/term-set'
import { isTrue } from '../../compare.js'
import * as ns from '../../namespaces.js'

function listItems (context, constraintComponent) {
  if (!context.valueOrNode.isList()) {
    context.test(false, constraintComponent, {
      message: [context.factory.literal('Value is not a list')],
      value: context.valueOrNode
    })

    return null
  }

  try {
    return [...context.valueOrNode.list()]
  } catch (err) {
    context.test(false, constraintComponent, {
      message: [context.factory.literal('List is malformed')],
      value: context.valueOrNode
    })

    return null
  }
}

function compileMaxListLength (shape, context) {
  const maxListLengthFunc = context.functionRegistry.compile(shape.ptr.out([ns.sh.maxListLength]), context)

  return {
    node: validateMaxListLength(maxListLengthFunc),
    value: validateMaxListLength(maxListLengthFunc)
  }
}

function validateMaxListLength (maxListLengthFunc) {
  return async context => {
    const items = listItems(context, ns.sh.MaxListLengthConstraintComponent)

    if (!items) {
      return
    }

    const maxListLengthPtr = await maxListLengthFunc(context)
    const maxListLengthValues = maxListLengthPtr.values.map(value => parseInt(value))
    const maxListLength = Math.min(...maxListLengthValues)
    const listLength = [...context.valueOrNode.list()].length

    context.test(listLength <= maxListLength, ns.sh.MaxListLengthConstraintComponent, {
      args: { listLength, maxListLength },
      message: [context.factory.literal('List is longer than {$maxListLength}')],
      value: context.valueOrNode
    })
  }
}

function compileMemberShape (shape, context) {
  const memberShapeFunc = context.functionRegistry.compile(shape.ptr.out([ns.sh.memberShape]), context)

  return {
    node: validateMemberShape(memberShapeFunc),
    value: validateMemberShape(memberShapeFunc)
  }
}

function validateMemberShape (memberShapeFunc) {
  return async context => {
    const items = listItems(context, ns.sh.MemberShapeConstraintComponent)

    if (!items) {
      return
    }

    const shapesPtr = await memberShapeFunc(context)
    const shapes = shapesPtr.map(shapePtr => context.getShape(shapePtr))
    const reports = []

    for (const shape of shapes) {
      for (const item of items) {
        const report = (await shape.validateNode(context.create({ child: true, focusNode: item, value: item }))).report

        reports.push(report)

        if (!(context.options.debug || context.options.details) && !report.conforms) {
          break
        }
      }

      context.test(reports.every(report => report.conforms), ns.sh.MemberShapeConstraintComponent, {
        args: { shape: shape.term },
        message: [context.factory.literal('Not all members conform to {$shape}')],
        results: reports.flatMap(report => report.results),
        value: context.valueOrNode
      })
    }
  }
}

function compileMinListLength (shape, context) {
  const minListLengthFunc = context.functionRegistry.compile(shape.ptr.out([ns.sh.minListLength]), context)

  return {
    node: validateMinListLength(minListLengthFunc),
    value: validateMinListLength(minListLengthFunc)
  }
}

function validateMinListLength (minListLengthFunc) {
  return async context => {
    const items = listItems(context, ns.sh.MinListLengthConstraintComponent)

    if (!items) {
      return
    }

    const minListLengthPtr = await minListLengthFunc(context)
    const minListLengthValues = minListLengthPtr.values.map(value => parseInt(value))
    const minListLength = Math.max(...minListLengthValues)
    const listLength = items.length

    context.test(listLength >= minListLength, ns.sh.MinListLengthConstraintComponent, {
      args: { listLength, minListLength },
      message: [context.factory.literal('List is short than {$maxListLength}')],
      value: context.valueOrNode
    })
  }
}

function compileUniqueMembers (shape, context) {
  const uniqueMembersFunc = context.functionRegistry.compile(shape.ptr.out([ns.sh.uniqueMembers]))

  return {
    node: validateUniqueMembers(uniqueMembersFunc),
    value: validateUniqueMembers(uniqueMembersFunc)
  }
}

function validateUniqueMembers (uniqueMembersFunc) {
  return async context => {
    const uniqueMembers = await uniqueMembersFunc(context)

    if (uniqueMembers.terms.every(term => !isTrue(term))) {
      return
    }

    const items = listItems(context, ns.sh.UniqueMembersConstraintComponent)

    if (!items) {
      return
    }

    const memberSet = new TermSet()
    const duplicates = new TermMap()

    for (const member of items) {
      if (memberSet.has(member.term)) {
        duplicates.set(member.term, member)
      }

      memberSet.add(member.term)
    }

    if (duplicates.size !== 0) {
      const details = [...duplicates.values()].map(duplicate => {
        return context.create({ child: true }).test(false, ns.sh.UniqueMembersConstraintComponent, {
          args: { duplicate: duplicate.term },
          message: [context.factory.literal('Not all members are unique (duplicate: {$duplicate})')],
          value: duplicate
        })
      })

      context.test(false, ns.sh.UniqueMembersConstraintComponent, {
        message: [context.factory.literal('Not all members are unique')],
        results: details,
        value: context.valueOrNode
      })
    }
  }
}

export {
  compileMaxListLength,
  compileMemberShape,
  compileMinListLength,
  compileUniqueMembers
}
