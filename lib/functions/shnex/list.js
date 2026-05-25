import TermSet from '@rdfjs/term-set'
import { isEmpty, isTrue } from '../../compare.js'
import * as ns from '../../namespaces.js'
import { copyArg, nodeExpArg, nodeExpFuncArg } from '../../node-expr/compile.js'

function compileConcat (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.concat,
    asArray: true
  }], async ({ factory, focusNode }, arg) => {
    if (!Array.isArray(arg)) {
      return focusNode.node([])
    }

    const terms = []

    for (const list of arg) {
      terms.push(...list.terms)
    }

    return focusNode.node(terms)
  })
}

function compileDistinct (funcContext) {
  return funcContext.compile([{
    ...nodeExpFuncArg,
    property: ns.shnex.distinct
  }, {
    ...nodeExpArg,
    property: ns.shnex.nodes
  }], async ({ focusNode }, distinctFunc, nodes) => {
    if (nodes.length === 0) {
      nodes = null
    }

    const results = await distinctFunc({ focusNode: nodes })

    return focusNode.node(new TermSet(results.map(result => result.term)))
  })
}

function compileFilterShape (funcContext) {
  return funcContext.compile([{
    ...copyArg,
    property: ns.shnex.filterShape
  }, {
    ...nodeExpArg,
    property: ns.shnex.nodes
  }], async ({ engine, factory, focusNode }, filterShape, nodes) => {
    if (!nodes) {
      nodes = focusNode
    }

    const terms = []

    for (const node of nodes) {
      const report = await engine.validate(node, filterShape)

      if (report.conforms) {
        terms.push(node.term)
      }
    }

    return focusNode.node(terms)
  })
}

function compileIntersection (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.intersection,
    asArray: true
  }], async ({ focusNode }, arg) => {
    const sets = arg.slice(1).map(arg => new TermSet(arg.terms))
    const intersections = new TermSet()

    for (const term of arg[0].terms) {
      if (sets.every(set => set.has(term))) {
        intersections.add(term)
      }
    }

    return focusNode.node(intersections)
  })
}

function compileLimit (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.limit
  }, {
    ...nodeExpArg,
    property: ns.shnex.nodes
  }], async ({ engine, factory, focusNode }, limit, nodes) => {
    if (!nodes) {
      nodes = focusNode
    }

    if (isEmpty(nodes)) {
      return focusNode.node([])
    }

    return focusNode.node(nodes.ptrs.slice(0, parseInt(limit.value)))
  })
}

function compileOffset (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.offset
  }, {
    ...nodeExpArg,
    property: ns.shnex.nodes
  }], async ({ engine, factory, focusNode }, offset, nodes) => {
    if (!nodes) {
      nodes = focusNode
    }

    if (isEmpty(nodes)) {
      return focusNode.node([])
    }

    return focusNode.node(nodes.ptrs.slice(parseInt(offset.value)))
  })
}

function compileOrderBy (funcContext) {
  return funcContext.compile([{
    ...nodeExpFuncArg,
    property: ns.shnex.orderBy
  }, {
    ...nodeExpArg,
    property: ns.shnex.desc
  }, {
    ...nodeExpArg,
    property: ns.shnex.nodes
  }], async ({ engine, factory, focusNode }, orderBy, desc, nodes) => {
    const descFlag = isTrue(desc.term)

    if (!nodes) {
      nodes = focusNode
    }

    const terms = []

    for (const node of nodes) {
      const sortPtr = await orderBy({ focusNode: node })

      terms.push({
        sort: sortPtr.value || '',
        term: node.term
      })
    }

    const sortedTerms = terms
      .sort((a, b) => descFlag ? b.sort.localeCompare(a.sort) : a.sort.localeCompare(b.sort))
      .map(i => i.term)

    return focusNode.node(sortedTerms)
  })
}

function compileRemove (funcContext) {
  return funcContext.compile([{
    ...nodeExpFuncArg,
    property: ns.shnex.remove
  }, {
    ...nodeExpArg,
    property: ns.shnex.nodes
  }], async ({ engine, factory, focusNode }, remove, nodes) => {
    if (!nodes) {
      nodes = focusNode
    }

    const toRemove = new TermSet((await remove({ focusNode: nodes })).terms)
    const terms = []

    for (const node of nodes) {
      if (!toRemove.has(node.term)) {
        terms.push(node.term)
      }
    }

    return focusNode.node(terms)
  })
}

export {
  compileConcat,
  compileDistinct,
  compileFilterShape,
  compileIntersection,
  compileLimit,
  compileOffset,
  compileOrderBy,
  compileRemove
}
