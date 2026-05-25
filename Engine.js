import TermSet from '@rdfjs/term-set'
import { PathList } from 'grapoi'
import constraints from './lib/constraints.js'
import functions from './lib/functions.js'
import * as ns from './lib/namespaces.js'
import FunctionContext from './lib/node-expr/FunctionContext.js'
import FunctionRegistry from './lib/node-expr/FunctionRegistry.js'
import ConstraintRegistry from './lib/validation/ConstraintRegistry.js'
import ValidationContext from './lib/validation/ValidationContext.js'
import ValidationShapeContext from './lib/validation/ValidationShapeContext.js'

class Engine {
  constructor (dataset, { factory, ...options }) {
    this.factory = factory
    this.options = options

    this.functionRegistry = new FunctionRegistry({ factory: this.factory, functions })
    this.validationRegistry = new ConstraintRegistry({ constraints })
    this.shapesPtr = new PathList({ dataset, factory })

    if (this.options.conformanceDisallows) {
      this.options.conformanceDisallows = new TermSet(this.options.conformanceDisallows)
    }

    if (this.options.coverage) {
      this.options.debug = true
      this.options.details = true
      this.options.trace = true
    }

    if (this.options.functions) {
      for (const [key, value] of this.options.functions) {
        this.functionRegistry.functions.set(key, value)
      }
    }

    if (this.options.constraints) {
      for (const [key, value] of this.options.constraints) {
        this.validationRegistry.constraints.set(key, value)
      }
    }

    if (!this.options.variables) {
      this.options.variables = new Map()
    }
  }

  _initShapes (context) {
    const shapePtrs = [
      ...this.shapesPtr.hasOut([ns.sh.targetClass]),
      ...this.shapesPtr.hasOut([ns.sh.targetNode]),
      ...this.shapesPtr.hasOut([ns.sh.targetObjectsOf]),
      ...this.shapesPtr.hasOut([ns.sh.targetSubjectsOf]),
      ...this.shapesPtr.hasOut([ns.rdf.type], [ns.sh.NodeShape]),
      ...this.shapesPtr.hasOut([ns.rdf.type], [ns.sh.PropertyShape]),
      ...this.shapesPtr.hasOut([ns.rdf.type], [ns.sh.ShapeClass])
    ]

    for (const shapePtr of shapePtrs) {
      context.getShape(shapePtr)
    }
  }

  async eval (data, expression) {
    const context = new FunctionContext({
      engine: this,
      expression,
      factory: this.factory,
      focusNode: data,
      functionRegistry: this.functionRegistry,
      options: this.options,
      validationRegistry: this.validationRegistry,
      variables: this.options.variables
    })

    const expressionFunc = context.functionRegistry.compile(expression, context)
    const result = await expressionFunc(context)

    return result
  }

  async validate (data, shapes) {
    const focusNode = new PathList({ ...data, factory: this.factory })
    const context = new ValidationContext({
      engine: this,
      factory: this.factory,
      functionRegistry: this.functionRegistry,
      options: this.options,
      validationRegistry: this.validationRegistry,
      variables: this.options.variables
    })

    if (shapes) {
      // if shapes are given, use only the term for the lookup in the ptr from the constructor
      shapes = shapes.map(shape => context.getShape(this.shapesPtr.node(shape.terms)))
    } else {
      this._initShapes(context)
      shapes = [...context.shapes.values()]
    }

    for (const shape of shapes) {
      const shapeContext = new ValidationShapeContext({ ...context, focusNode, shape })

      await shape.validate(shapeContext)
    }

    return context.report
  }
}

export default Engine
