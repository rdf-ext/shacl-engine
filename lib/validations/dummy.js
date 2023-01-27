import * as ns from '../namespaces.js'

function compileDummy () {
  return {
    generic: validateDummy()
  }
}

function validateDummy () {
  return context => {
    if (context.options.debug || context.options.details) {
      context.test(true, ns.sh.DummyConstraintComponent, {
        args: {},
        message: [context.factory.literal('Dummy for empty shape')],
        value: context.valueOrNode
      })
    }
  }
}

export {
  compileDummy
}
