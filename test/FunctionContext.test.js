import { rejects, strictEqual } from 'assert'
import { describe, it } from 'mocha'
import { termEqual } from 'rdf-test/assert.js'
import functions from '../lib/functions.js'
import { copyArg, nodeExpArg } from '../lib/node-expr/compile.js'
import FunctionContext from '../lib/node-expr/FunctionContext.js'
import FunctionRegistry from '../lib/node-expr/FunctionRegistry.js'
import ValidationShapeContext from '../lib/validation/ValidationShapeContext.js'
import factory from './support/factory.js'
import * as ns from './support/namespaces.js'
import { isGrapoi } from './support/utils.js'

const functionRegistry = new FunctionRegistry({
  factory,
  functions
})

async function testCompile ({
  compile,
  expression
}) {
  const functionContext = new FunctionContext({
    expression,
    factory,
    functionRegistry
  })

  const shapeContext = new ValidationShapeContext({
    factory,
    focusNode: expression
  })

  const compiled = compile(functionContext)

  return compiled(shapeContext)
}

describe('FunctionContext', () => {
  it('should be a class', () => {
    strictEqual(typeof FunctionContext, 'function')
  })

  describe('compile', () => {
    it('should be a function', () => {
      const expression = factory.grapoi({ dataset: factory.dataset() })

      const context = new FunctionContext({
        expression,
        factory,
        functionRegistry
      })

      strictEqual(typeof context.compile, 'function')
    })

    it('should compile the node expression function', async () => {
      let touched = false
      const arg = factory.literal('test')

      const expression = factory.grapoi()
        .node(factory.blankNode())
        .addOut(ns.ex.copy, arg)

      await testCompile({
        compile: functionContext => functionContext.compile([{
          ...copyArg,
          property: ns.ex.copy
        }], async () => {
          touched = true

          return []
        }),
        expression
      })

      strictEqual(touched, true)
    })

    it('should forward the compiled argument', async () => {
      let actual
      const arg = factory.literal('test')

      const expression = factory.grapoi()
        .node(factory.blankNode())
        .addOut(ns.ex.copy, arg)

      await testCompile({
        compile: functionContext => functionContext.compile([{
          ...copyArg,
          property: ns.ex.copy
        }], async (shapeContext, arg0) => {
          actual = arg0

          return []
        }),
        expression
      })

      termEqual(actual.term, arg)
    })

    it('should forward one argument per property', async () => {
      let actual
      const argA = factory.literal('test a')
      const argB = factory.literal('test a')

      const expression = factory.grapoi()
        .node(factory.blankNode())
        .addOut(ns.ex.copyA, argA)
        .addOut(ns.ex.copyB, argB)

      await testCompile({
        compile: functionContext => functionContext.compile([{
          ...copyArg,
          property: ns.ex.copyA
        }, {
          ...copyArg,
          property: ns.ex.copyB
        }], async (shapeContext, arg0, arg1) => {
          actual = [arg0, arg1]

          return []
        }),
        expression
      })

      termEqual(actual[0].term, argA)
      termEqual(actual[1].term, argB)
    })

    it('should throw an error if the compile function is missing', async () => {
      const arg = factory.literal('test')

      const expression = factory.grapoi()
        .node(factory.blankNode())
        .addOut(ns.ex.copy, arg)

      await rejects(async () => {
        await testCompile({
          compile: functionContext => functionContext.compile([{
            property: ns.ex.copy
          }], async () => []),
          expression
        })
      }, /Missing compile argument/)
    })

    it('should throw an error if the property is missing', async () => {
      const arg = factory.literal('test')

      const expression = factory.grapoi()
        .node(factory.blankNode())
        .addOut(ns.ex.copy, arg)

      await rejects(async () => {
        await testCompile({
          compile: functionContext => functionContext.compile([{
            ...copyArg
          }], async () => []),
          expression
        })
      }, /Missing property argument/)
    })
  })

  describe('nodeExpArg', () => {
    it('should return a Grapoi object', async () => {
      let actual
      const arg = factory.literal('test')

      const expression = factory.grapoi()
        .node(factory.blankNode())
        .addOut(ns.ex.copy, arg)

      await testCompile({
        compile: functionContext => functionContext.compile([{
          ...nodeExpArg,
          property: ns.ex.copy
        }], async (shapeContext, arg0) => {
          actual = arg0

          return []
        }),
        expression
      })

      strictEqual(isGrapoi(actual), true)
    })

    it('should return all arguments', async () => {
      let actual
      const argA = factory.literal('test a')
      const argB = factory.literal('test b')

      const expression = factory.grapoi()
        .node(factory.blankNode())
        .addOut(ns.ex.copy, [argA, argB])

      await testCompile({
        compile: functionContext => functionContext.compile([{
          ...nodeExpArg,
          property: ns.ex.copy
        }], async (shapeContext, arg0) => {
          actual = arg0

          return []
        }),
        expression
      })

      const terms = factory.termSet(actual.map(arg => arg.term))

      strictEqual(terms.size, 2)
      strictEqual(terms.has(argA), true)
      strictEqual(terms.has(argB), true)
    })

    it('should return all arguments from a list as an array', async () => {
      let actual
      const argA = factory.literal('test a')
      const argB = factory.literal('test b')
      const argC = factory.literal('test c')

      const expression = factory.grapoi().node(factory.blankNode())

      const list0 = expression.node(factory.blankNode())
        .addOut(ns.rdf.first, argA)
        .addOut(ns.rdf.rest, factory.blankNode(), rest => {
          rest.addOut(ns.rdf.first, argC)
          rest.addOut(ns.rdf.rest, ns.rdf.nil)
        })

      const list1 = expression.node(factory.blankNode())
        .addOut(ns.rdf.first, argB)
        .addOut(ns.rdf.rest, ns.rdf.nil)

      expression.addList(ns.ex.copy, [list0, list1])

      await testCompile({
        compile: functionContext => functionContext.compile([{
          ...nodeExpArg,
          asArray: true,
          property: ns.ex.copy
        }], async (shapeContext, arg0) => {
          actual = arg0

          return []
        }),
        expression
      })

      strictEqual(Array.isArray(actual), true)
      strictEqual(actual[0].terms.length, 2)
      termEqual(actual[0].terms[0], argA)
      termEqual(actual[0].terms[1], argC)
      strictEqual(actual[1].terms.length, 1)
      termEqual(actual[1].terms[0], argB)
    })

    it('should call nested functions', async () => {
      let actual
      const arg = factory.literal('http://example.org/')

      const expression = factory.grapoi()
        .node(factory.blankNode())
        .addOut(ns.ex.copy, ptr => {
          ptr.addOut(ns.sparql.iri, arg)
        })

      await testCompile({
        compile: functionContext => functionContext.compile([{
          ...nodeExpArg,
          property: ns.ex.copy
        }], async (shapeContext, arg0) => {
          actual = arg0

          return []
        }),
        expression
      })

      strictEqual(actual.term.termType, 'NamedNode')
      strictEqual(actual.term.value, arg.value)
    })
  })
})
