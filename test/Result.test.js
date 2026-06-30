import { strictEqual } from 'assert'
import DataFactory from '@rdfjs/data-model/Factory.js'
import Environment from '@rdfjs/environment'
import { describe, it } from 'mocha'
import Result from '../lib/Result.js'

describe('Result', () => {
  it('should be a class', () => {
    strictEqual(typeof Result, 'function')
  })

  describe('.message', () => {
    it('should pass undefined instead of null as the language for a message without a language tag', () => {
      let language

      class CustomDataFactory extends DataFactory {
        literal (value, languageOrDatatype) {
          language = languageOrDatatype

          return super.literal(value, languageOrDatatype)
        }
      }

      const factory = new Environment([CustomDataFactory])
      const message = factory.literal('test message')
      const result = new Result({ factory, message: [message], shape: { message: [] } })

      const [literal] = result.message

      strictEqual(language, undefined)
      strictEqual(literal.datatype.value, 'http://www.w3.org/2001/XMLSchema#string')
    })
  })
})
