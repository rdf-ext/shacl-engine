import TermMap from '@rdfjs/term-map'
import * as ns from '../../namespaces.js'
import { nodeExpArg } from '../../node-expr/compile.js'
import { select, stringifyPrefixes } from './sparql.js'

function compileSelect (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.sh.select
  }, {
    ...nodeExpArg,
    property: ns.sh.prefixes
  }
  ], async (context, queryPtr, prefixesPtr) => {
    const bindings = { this: context.focusNode.term }
    const prefixes = stringifyPrefixes(prefixesPtr)
    const query = [...prefixes, queryPtr.value]
      .filter(Boolean)
      .join('\n')

    const rows = await select({
      bindings,
      dataset: context.focusNode.dataset,
      factory: context.factory,
      query
    })

    const results = rows.map(row => {
      const vars = Object.values(row)

      if (vars[0]) {
        return context.factory.fromTerm(vars[0])
      }

      return null
    }).filter(Boolean)

    return context.focusNode.node(results)
  })
}

function compileSparqlExpr (funcContext) {
  return funcContext.compile([{
    ...nodeExpArg,
    property: ns.sh.sparqlExpr
  }, {
    ...nodeExpArg,
    property: ns.sh.prefixes
  }
  ], async (context, exprPtr, prefixesPtr) => {
    const bindings = { this: context.focusNode.term }
    const prefixes = stringifyPrefixes(prefixesPtr)
    const query = [...prefixes, `SELECT ?result WHERE { BIND(${exprPtr.value} AS ?result) }`]
      .filter(Boolean)
      .join('\n')

    const rows = await select({
      bindings,
      dataset: context.focusNode.dataset,
      factory: context.factory,
      query
    })

    const results = rows.map(row => {
      const vars = Object.values(row)

      if (vars[0]) {
        return context.factory.fromTerm(vars[0])
      }

      return null
    }).filter(Boolean)

    return context.focusNode.node(results)
  })
}

const funcs = new TermMap([
  [ns.sh.select, compileSelect],
  [ns.sh.sparqlExpr, compileSparqlExpr]
])

export default funcs
