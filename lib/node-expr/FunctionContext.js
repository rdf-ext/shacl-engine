import Context from '../Context.js'
import { compileFunc } from './compile.js'

class FunctionContext extends Context {
  constructor ({
    expression,
    ...args
  }) {
    super({ ...args })

    this.expression = expression
  }

  compile (args, func) {
    return compileFunc(this, args, func)
  }
}

export default FunctionContext
