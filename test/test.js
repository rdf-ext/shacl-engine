import { describe, run } from 'mocha'
import { validations as sparqlValidations } from '../sparql.js'
import { loadTests, runTests } from './support/utils.js'

(async () => {
  try {
    const files = {
      'coverage report': 'assets/coverage/manifest.ttl',
      custom: 'assets/custom/manifest.ttl',
      custom12: 'assets/custom12/manifest.ttl',
      'data-shapes test suite': 'assets/data-shapes/manifest.ttl',
      'result details': 'assets/details/manifest.ttl',
      message: 'assets/message/manifest.ttl',
      miscellaneous: 'assets/misc/manifest.ttl',
      severity: 'assets/severity/manifest.ttl',
      sparql: 'assets/sparql/manifest.ttl'
    }

    const validations = {
      'data-shapes test suite': sparqlValidations,
      sparql: sparqlValidations
    }

    const tests = {}

    for (const [name, file] of Object.entries(files)) {
      tests[name] = await loadTests(new URL(file, import.meta.url))
    }

    for (const [name, bundle] of Object.entries(tests)) {
      describe(name, () => {
        runTests(bundle, { validations: validations[name] })
      })
    }
  } catch (err) {
    console.error(err)
  }

  run()
})()
