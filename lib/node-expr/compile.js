import parsePath from '../parsePath.js'

function compileCopy (functionContext, arg) {
  return () => {
    return arg
  }
}

function compileFunc (functionContext, args, func) {
  const argsFuncs = args.map(({ asArray, compile, link, property }) => {
    if (!compile) {
      throw new Error('Missing compile argument')
    }

    if (!property) {
      throw new Error('Missing property argument')
    }

    const argPtr = functionContext.expression.out([property])

    let argFunc

    if (argPtr.isList()) {
      if (asArray) {
        const itemsFuncs = [...argPtr.list()].map(ptr => compile(functionContext, ptr, args))
        argFunc = shapeContext => Promise.all(itemsFuncs.map(itemFunc => itemFunc(shapeContext)))

        if (link) {
          const rawArgFunc = argFunc

          argFunc = async shapeContext => {
            const results = await rawArgFunc(shapeContext)

            return link(shapeContext, results)
          }
        }
      } else {
        const ptr = argPtr.node([...argPtr.list()].map(ptr => ptr.term))

        argFunc = compile(functionContext, ptr, args)
      }
    } else {
      argFunc = compile(functionContext, argPtr, args)
    }

    return shapeContext => argFunc(shapeContext)
  })

  return async shapeContext => {
    const args = (await Promise.all(argsFuncs.map(argFuncs => argFuncs(shapeContext))))

    return func(shapeContext, ...args)
  }
}

function compileNodeEx (functionContext, expression) {
  let ptrs

  if (expression.isList()) {
    ptrs = [...expression.list()]
  } else {
    ptrs = expression
  }

  const argFuncs = [...ptrs].map(ptr => functionContext.functionRegistry.compile(ptr))

  return async shapeContext => {
    const result = await Promise.all(argFuncs.map(argFunc => argFunc(shapeContext)))

    const terms = result.flatMap(r => {
      if (Array.isArray(r)) {
        return r.map(i => i.term || i)
      }
      return r.terms || r
    })

    return shapeContext.focusNode.node(terms)
  }
}

function compileNodeExFunc (functionContext, expression) {
  return async shapeContext => {
    return async ({ focusNode }) => {
      if (focusNode) {
        shapeContext = shapeContext.create({ focusNode })
      }

      let ptrs

      if (expression.isList()) {
        ptrs = [...expression.list()]
      } else {
        ptrs = expression
      }

      const argFuncs = [...ptrs].map(ptr => functionContext.functionRegistry.compile(ptr))

      const result = await Promise.all(argFuncs.map(argFunc => argFunc(shapeContext)))

      const terms = result.flatMap(r => {
        if (Array.isArray(r)) {
          return r.map(i => i.term || i)
        }
        return r.terms || r
      })

      return shapeContext.focusNode.node(terms)
    }
  }
}

function compilePath (functionContext, path) {
  const steps = parsePath(path)

  return () => steps
}

function linkNodeExFunc (context, results) {
  return async () => {
    return Promise.all(results.map(result => result(context)))
  }
}

const copyArg = {
  compile: compileCopy
}

const nodeExpArg = {
  compile: compileNodeEx
}

const nodeExpFuncArg = {
  compile: compileNodeExFunc,
  link: linkNodeExFunc
}

const pathArg = {
  compile: compilePath
}

export {
  compileFunc,
  copyArg,
  nodeExpArg,
  nodeExpFuncArg,
  pathArg
}
