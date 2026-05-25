import TermMap from '@rdfjs/term-map'
import * as ns from '../../namespaces.js'
import {
  compileIri
} from './terms.js'
import {
  compileEquals
} from './tests.js'

const funcs = new TermMap([
  [ns.sparql.iri, compileIri],

  [ns.sparql.equals, compileEquals]
])

export default funcs
