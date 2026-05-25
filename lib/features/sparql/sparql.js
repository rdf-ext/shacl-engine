import { QueryEngine } from '@comunica/query-sparql-rdfjs-lite'
import { Generator } from '@traqula/generator-sparql-1-2'
import { Parser } from '@traqula/parser-sparql-1-2'
import { AstTransformer, AstFactory } from '@traqula/rules-sparql-1-2'
import { Readable } from 'readable-stream'
import * as ns from '../../namespaces.js'

function prebindValues ({ query, bindings }) {
  const parser = new Parser()
  const parsedQuery = parser.parse(query)

  const F = new AstFactory()
  const transformer = new AstTransformer()

  parsedQuery.where = transformer.transformNodeSpecific(parsedQuery.where, {}, {
    term: {
      variable: {
        transform: variable => {
          const binding = bindings[variable.value]

          if (!binding) {
            return variable
          }

          if (binding.termType === 'Literal') {
            return F.literal(null, binding.value)
          }

          if (binding.termType === 'BlankNode') {
            return F.blankNode(null, binding.value)
          }

          if (binding.termType === 'NamedNode') {
            return F.termNamed(F.sourceLocationNodeReplace(variable), binding.value)
          }
        }
      }
    }
  })

  const generator = new Generator()
  query = generator.generate(parsedQuery)

  return query
}

async function select ({ bindings, dataset, query }) {
  const store = new DatasetSource(dataset)
  const engine = new QueryEngine()

  query = prebindValues({ query, bindings })

  const stream = await engine.queryBindings(query, { sources: [store] })

  const rows = []

  for await (const row of stream) {
    const object = {}

    for (const [key, value] of [...row]) {
      object[key.value] = value
    }

    rows.push(object)
  }

  return rows
}

function stringifyPath (path) {
  if (!path) {
    return null
  }

  return path.map(pathStep => {
    let sparqlPath = ''

    if (pathStep.start === 'object' && pathStep.end === 'subject') {
      sparqlPath += '^'
    }

    sparqlPath += pathStep.predicates.map(p => `<${p.value}>`).join('|')

    if (pathStep.quantifier === 'oneOrMore') {
      sparqlPath += '+'
    } else if (pathStep.quantifier === 'zeroOrMore') {
      sparqlPath += '*'
    } else if (pathStep.quantifier === 'zeroOrOne') {
      sparqlPath += '?'
    }

    return sparqlPath
  }).join('/')
}

function stringifyPrefixes (ptr, prefixes = []) {
  for (const imports of ptr.out([ns.owl.imports])) {
    stringifyPrefixes(imports, prefixes)
  }

  for (const declare of ptr.out([ns.sh.declare])) {
    const prefix = declare.out([ns.sh.prefix]).value
    const namespace = declare.out([ns.sh.namespace]).value

    prefixes.push(`PREFIX ${prefix}: <${namespace}>`)
  }

  return prefixes
}

class DatasetSource {
  constructor (dataset) {
    this.dataset = dataset
  }

  match (subject, predicate, object, graph) {
    return Readable.from(this.dataset.match(subject, predicate, object, graph))
  }
}

export {
  select,
  stringifyPath,
  stringifyPrefixes
}
