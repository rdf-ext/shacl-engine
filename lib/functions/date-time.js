import * as ns from '../namespaces.js'

function compileNow () {
  return shapeContext => {
    const now = new Date().toISOString()
    const term = shapeContext.factory.literal(now, ns.xsd.dateTime)

    return shapeContext.focusNode.node([term])
  }
}

export {
  compileNow
}
