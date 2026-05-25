import TermMap from '@rdfjs/term-map'
import * as ns from '../../namespaces.js'
import parsePath from '../../parsePath.js'
import { select, stringifyPath, stringifyPrefixes } from './sparql.js'

function compileSparql (shape) {
  const select = shape.sparql.out([ns.sh.select]).value
  const prefixes = stringifyPrefixes(shape.sparql.out([ns.sh.prefixes]))
  const sparqlPath = stringifyPath(shape.path)
  const message = shape.sparql.out([ns.sh.message]).terms

  const query = [...prefixes, select]
    .filter(Boolean)
    .join('\n')
    .split('$PATH')
    .join(sparqlPath)

  return {
    node: validateSparql({ message, query, source: shape.sparql.terms }),
    value: validateSparql({ message, query, source: shape.sparql.terms })
  }
}

function validateSparql ({ message, query, source }) {
  return async context => {
    const dataset = context.focusNode.dataset
    const factory = context.factory
    const bindings = { this: context.focusNode.term }
    const rows = await select({ bindings, dataset, factory, query })

    for (const row of rows) {
      const path = row.path && parsePath(context.focusNode.node([row.path]))
      const value = context.focusNode.node([row.value || context.focusNode.term])

      context.violation(ns.sh.SPARQLConstraintComponent, { args: row, message, path, source, value })
    }

    if (rows.length === 0) {
      context.debug(ns.sh.SPARQLConstraintComponent, { source })
    }
  }
}

const constraints = new TermMap([
  [ns.sh.sparql, compileSparql]
])

export default constraints
