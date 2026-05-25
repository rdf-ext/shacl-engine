import * as ns from '../../namespaces.js'
import { nodeExpArg, pathArg } from '../../node-expr/compile.js'

function compileEmpty () {
  return ({ focusNode }) => focusNode.node([])
}

function compileExists (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.exists
  }], async ({ factory, focusNode }, arg) => {
    const exists = arg.length !== 0

    return focusNode.node(factory.literal(exists.toString(), ns.xsd.boolean))
  })
}

function compileIf (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.if
  }, {
    ...nodeExpArg,
    property: ns.shnex.then
  }, {
    ...nodeExpArg,
    property: ns.shnex.else
  }], async ({ factory, focusNode }, condition, thenValue, elseValue) => {
    if (condition.length === 1 && condition.terms[0].equals(factory.literal('true', ns.xsd.boolean))) {
      return thenValue
    } else {
      return elseValue
    }
  })
}

function compilePathValues (funcContext) {
  return funcContext.compile([{
    ...pathArg,
    property: ns.shnex.pathValues
  }, {
    ...nodeExpArg,
    property: ns.shnex.focusNode
  }], async ({ focusNode }, steps, argFocusNode) => {
    if (argFocusNode.length !== 0) {
      return argFocusNode.executeAll(steps)
    }

    return focusNode.executeAll(steps)
  })
}

function compileVar (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.shnex.var
  }], async ({ focusNode, variables }, arg) => {
    return variables.get(arg.value) || focusNode.node([])
  })
}

export {
  compileEmpty,
  compileExists,
  compileIf,
  compilePathValues,
  compileVar
}
