import * as ns from '../namespaces.js'
import { select } from '../sparql.js'

function compileSelect (funcContext) {
  return funcContext.compileFunc(ns.sh.select, async ({ factory, focusNode }, arg) => {
    const rows = await select({
      bindings: [],
      dataset: focusNode.dataset,
      factory,
      query: arg.value
    })

    return rows.map(row => {
      const vars = [...row]

      if (vars.length > 0 && vars[0].length > 1) {
        return factory.fromTerm([...row][0][1])
      }

      return null
    }).filter(Boolean)
  })
}

export {
  compileSelect
}
