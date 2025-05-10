import { compileSelect } from './lib/functions/sparql.js'
import * as ns from './lib/namespaces.js'
import { compileSparql } from './lib/validations/sparql.js'

const functions = new Map([
  [ns.sh.select, compileSelect]
])

const validations = new Map([
  [ns.sh.sparql, compileSparql]
])

export {
  functions,
  validations
}
