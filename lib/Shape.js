import once from 'lodash/once.js'
import * as ns from './namespaces.js'
import parsePath from './parsePath.js'
import ShapeValidator from './ShapeValidator.js'
import TargetResolver from './TargetResolver.js'

class Shape {
  constructor (ptr, { validator }) {
    this.ptr = ptr
    this.validator = validator

    this._message = once(() => this.ptr.out([ns.sh.message]).terms)
    this._path = once(() => parsePath(this.ptr.out([ns.sh.path])))
    this._severity = once(() => this.ptr.out([ns.sh.severity]).term)
    this._shapeValidator = once(() => new ShapeValidator(this))
    this._targetResolver = once(() => new TargetResolver(this.ptr))
  }

  get isPropertyShape () {
    return Boolean(this.path)
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

  resolveTargets (context) {
    return this.targetResolver.resolve(context)
  }

  async validate (context) {
    return this.shapeValidator.validate(context)
  }
}

export default Shape
