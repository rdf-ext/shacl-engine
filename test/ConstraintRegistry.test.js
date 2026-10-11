import { strictEqual } from 'assert'
import { describe, it } from 'mocha'
import Engine from '../Engine.js'
import factory from './support/factory.js'
import * as ns from './support/namespaces.js'
import { parseString } from './support/utils.js'

async function validate ({ constraints, shapes }) {
  const dataset = await parseString('text/turtle', `
    @prefix ex: <http://example.org/>.
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
    @prefix sh: <http://www.w3.org/ns/shacl#>.

    ${shapes}
  `)

  const engine = new Engine(dataset, { factory, constraints })

  return engine.validate({ dataset })
}

function countingConstraint () {
  const counter = { compiled: 0 }

  counter.compile = () => {
    counter.compiled++

    return {
      node: context => context.violation(ns.ex.TestConstraintComponent)
    }
  }

  return counter
}

describe('ConstraintRegistry', () => {
  describe('.compile', () => {
    it('should compile a constraint registered for multiple predicates only once', async () => {
      const constraint = countingConstraint()

      const report = await validate({
        constraints: [[ns.ex.paramA, constraint.compile], [ns.ex.paramB, constraint.compile]],
        shapes: `
          ex:Shape a sh:NodeShape;
            sh:targetNode ex:node;
            ex:paramA "a";
            ex:paramB "b".
        `
      })

      strictEqual(constraint.compiled, 1)
      strictEqual(report.results.length, 1)
    })

    it('should not split a constraint for reifiers without SHACL annotations', async () => {
      const constraint = countingConstraint()

      const report = await validate({
        constraints: [[ns.ex.param, constraint.compile]],
        shapes: `
          ex:Shape a sh:NodeShape;
            sh:targetNode ex:node;
            ex:param "a" {| rdfs:comment "provenance" |};
            ex:param "b".
        `
      })

      strictEqual(constraint.compiled, 1)
      strictEqual(report.results.length, 1)
      strictEqual(report.results[0].severity.equals(ns.sh.Violation), true)
    })
  })
})
