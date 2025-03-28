class FunctionContext {
  constructor ({
    expression,
    factory,
    functionRegistry
  }) {
    this.expression = expression
    this.factory = factory
    this.functionRegistry = functionRegistry
  }

  compile (...args) {
    return this.functionRegistry.compile(...args)
  }

  compileAll (...args) {
    return this.functionRegistry.compileAll(...args)
  }
}

export default FunctionContext
