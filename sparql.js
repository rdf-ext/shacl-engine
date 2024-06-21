import * as ns from './lib/namespaces.js'
import { compileSparql } from './lib/validations/sparql.js'

const validations = new Map([
  [ns.sh.sparql, compileSparql]
])

export {
  validations
}
