import TermMap from '@rdfjs/term-map'
import * as ns from '../../namespaces.js'
import {
  compileMaxCount,
  compileMinCount
} from './cardinality.js'
import {
  compileMaxListLength,
  compileMemberShape,
  compileMinListLength,
  compileUniqueMembers
} from './list.js'
import {
  compileAnd,
  compileNot,
  compileOr,
  compileXone
} from './logical.js'
import {
  compileClosedNode,
  compileHasValue,
  compileIn,
  compileRootClass,
  compileUniqueValuesFor
} from './other.js'
import {
  compileDisjoint,
  compileEquals,
  compileLessThan,
  compileLessThanOrEquals,
  compileSubsetOf
} from './property-pair.js'

import {
  compileNode,
  compileNodeByExpression,
  compileProperty,
  compileQualifiedValueShape,
  compileSomeValue
} from './shape.js'
import {
  compileLanguageIn,
  compileMaxLength,
  compileMinLength,
  compilePattern,
  compileSingleLine,
  compileUniqueLang
} from './string.js'
import {
  compileMaxExclusive,
  compileMaxInclusive,
  compileMinExclusive,
  compileMinInclusive
} from './value-range.js'
import {
  compileClass,
  compileDatatype,
  compileNodeKind
} from './value-type.js'

const constraints = new TermMap([
  [ns.sh.maxCount, compileMaxCount],
  [ns.sh.minCount, compileMinCount],

  [ns.sh.maxListLength, compileMaxListLength],
  [ns.sh.memberShape, compileMemberShape],
  [ns.sh.minListLength, compileMinListLength],
  [ns.sh.uniqueMembers, compileUniqueMembers],

  [ns.sh.and, compileAnd],
  [ns.sh.not, compileNot],
  [ns.sh.or, compileOr],
  [ns.sh.xone, compileXone],

  [ns.sh.closed, compileClosedNode],
  [ns.sh.hasValue, compileHasValue],
  [ns.sh.in, compileIn],
  [ns.sh.rootClass, compileRootClass],
  [ns.sh.uniqueValuesFor, compileUniqueValuesFor],

  [ns.sh.disjoint, compileDisjoint],
  [ns.sh.equals, compileEquals],
  [ns.sh.lessThan, compileLessThan],
  [ns.sh.lessThanOrEquals, compileLessThanOrEquals],
  [ns.sh.subsetOf, compileSubsetOf],

  [ns.sh.maxExclusive, compileMaxExclusive],
  [ns.sh.maxInclusive, compileMaxInclusive],
  [ns.sh.minExclusive, compileMinExclusive],
  [ns.sh.minInclusive, compileMinInclusive],

  [ns.sh.node, compileNode],
  [ns.sh.nodeByExpression, compileNodeByExpression],

  [ns.sh.property, compileProperty],
  [ns.sh.qualifiedValueShape, compileQualifiedValueShape],
  [ns.sh.someValue, compileSomeValue],

  [ns.sh.languageIn, compileLanguageIn],
  [ns.sh.maxLength, compileMaxLength],
  [ns.sh.minLength, compileMinLength],
  [ns.sh.pattern, compilePattern],
  [ns.sh.singleLine, compileSingleLine],
  [ns.sh.uniqueLang, compileUniqueLang],

  [ns.sh.class, compileClass],
  [ns.sh.datatype, compileDatatype],
  [ns.sh.nodeKind, compileNodeKind]
])

export default constraints
