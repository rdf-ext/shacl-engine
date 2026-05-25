import TermMap from '@rdfjs/term-map'
import Shape from './Shape.js'

class Context {
  constructor ({
    engine,
    factory,
    focusNode,
    functionRegistry,
    options = { debug: false, details: false },
    shapes = new TermMap(),
    validationRegistry,
    variables = new Map()
  }) {
    this.engine = engine
    this.factory = factory
    this.functionRegistry = functionRegistry
    this.focusNode = focusNode
    this.options = options
    this.shapes = shapes
    this.validationRegistry = validationRegistry
    this.variables = variables
    this.variables.set('focusNode', this.focusNode)
  }

  create (args) {
    return new this.constructor({ ...this, ...args })
  }

  getShape (ptr) {
    if (!ptr.term) {
      return null
    }

    let shape = this.shapes.get(ptr.term)

    if (!shape) {
      shape = new Shape(ptr, this)
      this.shapes.set(ptr.term, shape)
    }

    return shape
  }
}

export default Context
