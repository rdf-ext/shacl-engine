import TermMap from '@rdfjs/term-map'
import core from './constraints/core/index.js'
import nodeExpr from './constraints/node-expr/node-expr.js'

const constraints = new TermMap([
  ...core,
  ...nodeExpr
])

export default constraints
