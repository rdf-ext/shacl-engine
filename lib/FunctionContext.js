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

  compileFunc (property, func) {
    let argFuncs
    const argPtr = this.expression.out([property])

    if (argPtr.isList()) {
      argFuncs = this.compileAll(argPtr.list())
    } else {
      argFuncs = [this.compile(argPtr)]
    }

    return async shapeContext => {
      const args = await Promise.all(argFuncs.map(argFunc => argFunc(shapeContext)))

      return shapeContext.focusNode.node(await func(shapeContext, ...args))
    }
  }
}

export default FunctionContext
