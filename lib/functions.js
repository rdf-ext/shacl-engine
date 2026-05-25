import TermMap from '@rdfjs/term-map'
import shnexFuncs from './functions/shnex/index.js'
import sparqlFuncs from './functions/sparql/index.js'

const funcs = new TermMap([
  ...shnexFuncs,
  ...sparqlFuncs
])

export default funcs
