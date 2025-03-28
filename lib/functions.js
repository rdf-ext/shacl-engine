import TermMap from '@rdfjs/term-map'
import { compileAdd, compileSubtract } from './functions/arithmetic.js'
import { compileEq } from './functions/compare.js'
import { compileIri, compilePath, compileStrdt } from './functions/core.js'
import { compileNow } from './functions/date-time.js'
import { compileNot } from './functions/logical.js'
import { compileExists } from './functions/others.js'
import * as ns from './namespaces.js'

const funcs = new TermMap([
  [ns.shn.add, compileAdd],
  [ns.shn.subtract, compileSubtract],

  [ns.shn.eq, compileEq],

  [ns.shn.iri, compileIri],
  [ns.sh.path, compilePath],
  [ns.shn.strdt, compileStrdt],

  [ns.shn.now, compileNow],

  [ns.sh.not, compileNot],

  [ns.shn.exists, compileExists]
])

export default funcs
