class FunctionContext {
  constructor ({
    expression,
    functionRegistry
  }) {
    this.expression = expression
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
