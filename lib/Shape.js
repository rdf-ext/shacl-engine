import once from 'lodash/once.js'
import { fromRdf } from 'rdf-literal'
import * as ns from './namespaces.js'
import parsePath from './parsePath.js'
import TargetResolver from './TargetResolver.js'
import ShapeValidator from './validation/ShapeValidator.js'

class Shape {
  constructor (ptr, context) {
    this.ptr = ptr

    this._deactivatedFunc = once(() => {
      const deactivated = this.ptr.out([ns.sh.deactivated])

      if (deactivated.length === 0) {
        return () => false
      }

      const func = context.functionRegistry.compile(deactivated)

      return async shapeContext => {
        const result = await func(shapeContext)
        const term = result.term

        return term && fromRdf(term)
      }
    })
    this._message = once(() => this.ptr.out([ns.sh.message]).terms)
    this._path = once(() => parsePath(this.ptr.out([ns.sh.path])))
    this._severity = once(() => this.ptr.out([ns.sh.severity]).term)
    this._shapeValidator = once(() => new ShapeValidator(this, context))
    this._sparql = once(() => this.ptr.out([ns.sh.sparql]))
    this._targetResolver = once(() => new TargetResolver(this, context))
    this._valuesFunc = once(() => {
      const values = this.ptr.out([ns.sh.values])

      if (values.length === 0) {
        return null
      }

      return context.functionRegistry.compile(values)
    })
  }

  get deactivatedFunc () {
    return this._deactivatedFunc()
  }

  get isPropertyShape () {
    return Boolean(this.path) || this.isValueShape
  }

  get isSparqlShape () {
    return this.sparql.length > 0
  }

  get isValueShape () {
    return Boolean(this.valuesFunc)
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

  get valuesFunc () {
    return this._valuesFunc()
  }

  async resolveTargets (context) {
    return this.targetResolver.resolve(context)
  }

  async validate (shapeContext) {
    shapeContext = shapeContext.create({ shape: this })

    let targets

    // if the focusNode already has terms, there is no need to resolve the targets
    if (!shapeContext.focusNode.isAny()) {
      targets = shapeContext.focusNode
    } else {
      targets = await this.resolveTargets(shapeContext)
    }

    await this.shapeValidator.validateNodes(shapeContext.create({ focusNode: targets }))

    for (const focusNode of targets) {
      await this.validateNode(shapeContext.create({ focusNode }))
    }
  }

  async validateNode (context) {
    context = context.create({ shape: this })

    // ignore deactivated shape
    if (await this.deactivatedFunc(context)) {
      return context
    }

    const id = context.id()

    if (context.processed.has(id)) {
      if (context.results.has(id)) {
        for (const result of context.results.get(id)) {
          context.report.results.push(result)
        }
      }

      return context
    }

    context.processed.add(id)

    return this.shapeValidator.validate(context)
  }
}

export default Shape
