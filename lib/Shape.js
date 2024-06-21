import once from 'lodash/once.js'
import { fromRdf } from 'rdf-literal'
import * as ns from './namespaces.js'
import parsePath from './parsePath.js'
import ShapeValidator from './ShapeValidator.js'
import TargetResolver from './TargetResolver.js'

class Shape {
  constructor (ptr, { validator }) {
    this.ptr = ptr
    this.validator = validator

    this._deactivated = once(() => {
      const deactivatedTerm = this.ptr.out([ns.sh.deactivated]).term

      return deactivatedTerm && fromRdf(deactivatedTerm)
    })
    this._message = once(() => this.ptr.out([ns.sh.message]).terms)
    this._path = once(() => parsePath(this.ptr.out([ns.sh.path])))
    this._severity = once(() => this.ptr.out([ns.sh.severity]).term)
    this._shapeValidator = once(() => new ShapeValidator(this))
    this._sparql = once(() => this.ptr.out([ns.sh.sparql]))
    this._targetResolver = once(() => new TargetResolver(this.ptr))
  }

  get deactivated () {
    return this._deactivated()
  }

  get isPropertyShape () {
    return Boolean(this.path)
  }

  get isSparqlShape () {
    return this.sparql.terms.length > 0
  }

  get path () {
    return this._path()
  }

  get targetResolver () {
    return this._targetResolver()
  }

  get message () {
    return this._message()
  }

  get severity () {
    return this._severity()
  }

  get shapeValidator () {
    return this._shapeValidator()
  }

  get sparql () {
    return this._sparql()
  }

  resolveTargets (context) {
    return this.targetResolver.resolve(context)
  }

  async validate (context) {
    return this.shapeValidator.validate(context)
  }
}

export default Shape
