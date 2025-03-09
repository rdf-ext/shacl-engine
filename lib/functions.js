import TermMap from '@rdfjs/term-map'
import { compileAdd, compileSubtract } from './functions/arithmetic.js'
import { compileIri, compilePath, compileStrdt } from './functions/core.js'
import { compileNow } from './functions/date-time.js'
import * as ns from './namespaces.js'

const funcs = new TermMap([
  [ns.shn.add, compileAdd],
  [ns.shn.subtract, compileSubtract],

  [ns.shn.iri, compileIri],
  [ns.sh.path, compilePath],
  [ns.shn.strdt, compileStrdt],

  [ns.shn.now, compileNow]
])

export default funcs
