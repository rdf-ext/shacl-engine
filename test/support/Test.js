import { rejects } from 'node:assert'
import grapoi from 'grapoi'
import { datasetEqual } from 'rdf-test/assert.js'
import Engine from '../../Engine.js'
import rdf from './factory.js'
import listEqual from './listEqual.js'
import * as ns from './namespaces.js'
import { loadDataset, loadManifest, normalizeReport, parseString } from './utils.js'

class Test {
  constructor ({ entry }) {
    this.entry = entry

    this.action = null
    this.data = null
    this.label = null
    this.result = null
  }

  async init () {
    this.action = this.entry.out(ns.mf.action)
    this.label = this.entry.out(ns.rdfs.label)
    this.result = this.entry.out(ns.mf.result)
  }

  static async loadTest ({ entry, entryList }) {
    const type = entry.out(ns.rdf.type).term

    if (ns.sht.Validate.equals(type)) {
      return ValidationTest.load({ entry })
    }

    if (ns.sht.EvalNodeExpr.equals(type)) {
      return NodeExpressionTest.load({ entry, entryList })
    }

    console.log(`${entry.value}: test type ${type.value} unsupported`)

    return null
  }

  static async loadTests (url) {
    const manifest = await loadManifest(url)
    const tests = []

    for (const entryList of manifest.out(ns.mf.entries)) {
      for (const entry of entryList.list()) {
        const test = await Test.loadTest({ entry, entryList })

        if (test) {
          tests.push(test)
        }
      }
    }

    return tests
  }
}

class ValidationTest extends Test {
  constructor ({ entry }) {
    super({ entry })

    this.expectFailure = null
    this.options = {}
    this.shapes = null
    this.resultType = null
  }

  async init () {
    await super.init()

    this.data = await loadDataset(this.action.out(ns.sht.dataGraph))
    this.expectFailure = ns.sht.Failure.equals(this.result.term)
    this.resultType = this.result.out(ns.rdf.type).term
    this.shapes = await loadDataset(this.action.out(ns.sht.shapesGraph))

    const conformanceDisallows = this.result.out(ns.sh.conformanceDisallows).terms
    const hasDebugSeverity = this.result.out(ns.sh.result).out(ns.sh.resultSeverity, ns.shn.Debug).length > 0
    const hasDetails = this.result.out(ns.sh.result).out(ns.sh.detail).length > 0
    const hasTraceSeverity = this.result
      .out(ns.sh.result)
      .execute({ end: 'object', predicates: [ns.sh.detail], quantifier: 'zeroOrMore', start: 'subject' })
      .out(ns.sh.resultSeverity, ns.shn.Trace)
      .length > 0

    this.options.conformanceDisallows = conformanceDisallows.length !== 0 ? conformanceDisallows : null
    this.options.coverage = hasTraceSeverity // hasCoverageResultType
    this.options.debug = hasDebugSeverity
    this.options.details = hasDetails

    return this
  }

  async run ({ constraints, functions } = {}) {
    if (ns.sht.Coverage.equals(this.resultType)) {
      const validator = new Engine(this.shapes, { factory: rdf, constraints, functions, ...this.options, coverage: true })
      const report = await validator.validate({ dataset: this.data })
      const coverage = rdf.dataset(report.coverage())
      const expected = await parseString('text/turtle', this.result.out(ns.sht.coverage).value)

      datasetEqual(coverage, expected)
    } else if (ns.sh.ValidationReport.equals(this.resultType) || this.expectFailure) {
      const validator = new Engine(this.shapes, {
        factory: rdf,
        functions,
        constraints,
        ...this.options
      })

      if (this.expectFailure) {
        await rejects(async () => {
          await validator.validate({ dataset: this.data })
        })
      } else {
        const report = await validator.validate({ dataset: this.data })
        const expected = normalizeReport(report, this.result)

        datasetEqual(report.dataset, expected)
      }
    } else {
      throw new Error(`unknown test type: ${this.resultType.value}`)
    }
  }

  static async load ({ entry }) {
    const test = new ValidationTest({ entry })

    return test.init()
  }
}

class NodeExpressionTest extends Test {
  constructor ({ entry, entryList }) {
    super({ entry })

    this.entryList = entryList
    this.base = null
    this.focusNode = null
    this.nodeExpr = null
    this.variables = null
  }

  async init () {
    this.base = this.entryList.in(ns.mf.entries)
    this.data = await loadDataset(this.base, { baseIRI: this.base.value })
    this.entry = grapoi({ dataset: this.data, term: this.entry.term, factory: rdf })

    await super.init()

    this.nodeExpr = this.action.out(ns.sht.nodeExpr)
    this.variables = new Map(this.action.trim().out()
      .filter(ptr => ptr.ptrs[0].edges[0].quad.predicate.value.startsWith('http://www.w3.org/ns/shacl-test#scope-'))
      .map(ptr => {
        const [, name] = ptr.ptrs[0].edges[0].quad.predicate.value.split('http://www.w3.org/ns/shacl-test#scope-')

        return [name, ptr]
      }))

    this.focusNode = this.action.out(ns.sht.focusNode)

    if (this.focusNode.length === 0) {
      this.focusNode = this.nodeExpr
    }

    return this
  }

  async run ({ constraints, functions } = {}) {
    const engine = new Engine(this.data, { factory: rdf, constraints, functions, variables: this.variables })
    const result = await engine.eval(this.focusNode, this.nodeExpr)
    const actual = result.ptrs.map(ptr => ptr.term)
    const expected = [...this.result.list()].map(ptr => ptr.term)

    listEqual(actual, expected)
  }

  static async load ({ entry, entryList }) {
    const test = new NodeExpressionTest({ entry, entryList })

    return test.init()
  }
}

export default Test
