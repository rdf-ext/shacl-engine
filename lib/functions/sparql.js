import * as ns from '../namespaces.js'
import { select } from '../sparql.js'

function compileSelect (funcContext) {
  const argFunc = funcContext.compile(funcContext.expression.out([ns.sh.select]))

  return async shapeContext => {
    const arg = await argFunc(shapeContext)

    const rows = await select({
      bindings: [],
      dataset: shapeContext.focusNode.dataset,
      factory: shapeContext.factory,
      query: arg.value
    })

    const terms = rows.map(row => {
      const vars = [...row]

      if (vars.length > 0 && vars[0].length > 1) {
        return shapeContext.factory.fromTerm([...row][0][1])
      }

      return null
    }).filter(Boolean)

    return shapeContext.focusNode.node(terms)
  }
}

export {
  compileSelect
}
