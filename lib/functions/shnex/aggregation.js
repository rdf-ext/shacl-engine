import * as ns from '../../namespaces.js'
import { nodeExpArg } from '../../node-expr/compile.js'
import XsdNumber from '../../XsdNumber.js'

function compileCount (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.count
  }], async ({ factory, focusNode }, arg) => {
    return focusNode.node([factory.literal(arg.length.toString(), ns.xsd.integer)])
  })
}

function compileMax (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.max
  }], async ({ factory, focusNode }, arg) => {
    let max = -Infinity

    for (const term of arg.terms) {
      const value = parseFloat(term.value)

      if (value > max) {
        max = value
      }
    }

    if (max === -Infinity) {
      return focusNode.node([])
    }

    return focusNode.node(factory.literal(max, ns.xsd.integer))
  })
}

function compileMin (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.min
  }], async ({ factory, focusNode }, arg) => {
    let min = Infinity

    for (const term of arg.terms) {
      const value = parseFloat(term.value)

      if (value < min) {
        min = value
      }
    }

    if (min === Infinity) {
      return focusNode.node([])
    }

    return focusNode.node(factory.literal(min, ns.xsd.integer))
  })
}

function compileSum (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.sum
  }], async ({ factory, focusNode }, arg) => {
    try {
      let sum = new XsdNumber(0, ns.xsd.integer)

      for (const term of arg.terms) {
        sum = sum.add(new XsdNumber(term.value, term.datatype))
      }

      return focusNode.node(sum.toTerm(factory))
    } catch (err) {
      console.log(err)
    }
  })
}

export {
  compileCount,
  compileMax,
  compileMin,
  compileSum
}
