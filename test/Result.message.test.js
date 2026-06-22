import assert from 'node:assert'
import { describe, it } from 'mocha'
import { Parser, Store, DataFactory } from 'n3'
import { Validator } from '../index.js'

describe('Result.message (regression #79)', () => {
  // A sh:message / constraint-component message without a language tag has
  // language === ''. Result#_message used to compute `message.language || null`,
  // forwarding `null` to factory.literal. n3's DataFactory rejects null with
  // "Cannot use 'in' operator to search for 'termType' in null"; the rdfjs
  // default factory silently tolerates it. So we assert shacl-engine's own
  // contract -- it must never forward null -- which is deterministic regardless
  // of which factory (and which n3 version) is in use.
  it('never forwards null as the language argument to factory.literal', async () => {
    const langArgs = []
    const factory = Object.assign(Object.create(DataFactory), {
      literal (value, languageOrDatatype) {
        langArgs.push(languageOrDatatype)
        // normalise so the test does not depend on the factory rejecting null
        return DataFactory.literal(value, languageOrDatatype === null ? undefined : languageOrDatatype)
      }
    })

    // explicit sh:message with NO language tag -> message.language === '' at the buggy line
    const shapes = new Store(new Parser().parse(`
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix ex: <http://example.org/> .
      ex:S a sh:NodeShape ; sh:targetClass ex:T ;
        sh:property [ sh:path ex:p ; sh:minCount 1 ; sh:message "no lang here" ] .
    `))
    const data = new Store(new Parser().parse(`
      @prefix ex: <http://example.org/> .
      ex:x a ex:T .
    `))

    const report = await new Validator(shapes, { factory, details: true })
      .validate({ dataset: data })

    assert.strictEqual(report.results.length, 1)
    const [result] = report.results

    // touching .message runs Result#_message -> factory.literal(...)
    const message = result.message

    assert.ok(langArgs.length > 0, 'factory.literal was never called for the message')
    assert.ok(!langArgs.includes(null), 'Result forwarded null as the language argument (bug #79)')

    // and the produced message is a well-formed plain literal
    assert.strictEqual(message[0].termType, 'Literal')
    assert.strictEqual(message[0].value, 'no lang here')
    assert.strictEqual(message[0].language, '')
    assert.strictEqual(message[0].datatype.value, 'http://www.w3.org/2001/XMLSchema#string')
  })
})