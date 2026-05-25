import TermMap from '@rdfjs/term-map'
import * as ns from '../../namespaces.js'
import {
  compileFindFirst,
  compileFlatMap,
  compileMatchAll
} from './advanced-sequence.js'
import {
  compileCount,
  compileMax,
  compileMin,
  compileSum
} from './aggregation.js'
import {
  compileExists,
  compileIf,
  compilePathValues,
  compileVar
} from './basic.js'
import {
  compileConcat,
  compileDistinct,
  compileFilterShape,
  compileIntersection,
  compileLimit,
  compileOffset,
  compileOrderBy,
  compileRemove
} from './list.js'
import {
  compileInstanceOf,
  compileNodesMatching
} from './miscellaneous.js'

const funcs = new TermMap([
  [ns.shnex.findFirst, compileFindFirst],
  [ns.shnex.flatMap, compileFlatMap],
  [ns.shnex.matchAll, compileMatchAll],

  [ns.shnex.count, compileCount],
  [ns.shnex.max, compileMax],
  [ns.shnex.min, compileMin],
  [ns.shnex.sum, compileSum],

  [ns.shnex.exists, compileExists],
  [ns.shnex.if, compileIf],
  [ns.shnex.pathValues, compilePathValues],
  [ns.shnex.var, compileVar],

  [ns.shnex.concat, compileConcat],
  [ns.shnex.distinct, compileDistinct],
  [ns.shnex.filterShape, compileFilterShape],
  [ns.shnex.intersection, compileIntersection],
  [ns.shnex.limit, compileLimit],
  [ns.shnex.offset, compileOffset],
  [ns.shnex.orderBy, compileOrderBy],
  [ns.shnex.remove, compileRemove],

  [ns.shnex.instancesOf, compileInstanceOf],
  [ns.shnex.nodesMatching, compileNodesMatching]
])

export default funcs
