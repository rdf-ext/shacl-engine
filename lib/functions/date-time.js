import * as ns from '../namespaces.js'

function compileNow () {
  return ({ factory, focusNode }) => {
    const now = new Date().toISOString()
    const term = factory.literal(now, ns.xsd.dateTime)

    return focusNode.node([term])
  }
}

export {
  compileNow
}
