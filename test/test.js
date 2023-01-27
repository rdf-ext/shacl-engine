import { describe, run } from 'mocha'
import { loadTests, runTests } from './support/utils.js'

(async () => {
  const coverageTests = await loadTests(new URL('assets/coverage/manifest.ttl', import.meta.url))

  describe('coverage report', () => {
    runTests(coverageTests)
  })

  const dataShapesTests = await loadTests(new URL('assets/data-shapes/manifest.ttl', import.meta.url))

  describe('data-shapes test suite', () => {
    runTests(dataShapesTests)
  })

  const detailTests = await loadTests(new URL('assets/details/manifest.ttl', import.meta.url))

  describe('result details', () => {
    runTests(detailTests)
  })

  run()
})()
