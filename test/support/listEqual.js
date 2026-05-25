import { strictEqual } from 'assert'
import toNT from '@rdfjs/to-ntriples'

function listEqual (actual, expected) {
  const actualStr = actual.map(a => toNT(a)).join('\n')
  const expectedStr = expected.map(b => toNT(b)).join('\n')

  strictEqual(actualStr, expectedStr)
}

export default listEqual
