import { describe, it, run } from 'mocha'
import { functions as sparqlFunctions, constraints as sparqlConstraints } from '../sparql.js'
import Test from './support/Test.js'

(async () => {
  try {
    const files = {
      'coverage report': 'assets/coverage/manifest.ttl',
      custom: 'assets/custom/manifest.ttl',
      'data-shapes test suite': 'assets/data-shapes/manifest.ttl',
      'result details': 'assets/details/manifest.ttl',
      message: 'assets/message/manifest.ttl',
      miscellaneous: 'assets/misc/manifest.ttl',
      severity: 'assets/severity/manifest.ttl',
      sparql: 'assets/sparql/manifest.ttl'
    }

    const functions = {
      custom12: sparqlFunctions,
      'data-shapes test suite': sparqlFunctions
    }

    const constraints = {
      'data-shapes test suite': sparqlConstraints,
      sparql: sparqlConstraints
    }

    const tests = {}

    for (const [name, file] of Object.entries(files)) {
      tests[name] = await Test.loadTests(new URL(file, import.meta.url))
    }

    for (const [name, bundle] of Object.entries(tests)) {
      describe(name, () => {
        for (const test of bundle) {
          it(test.label.value, async () => {
            await test.run({
              constraints: constraints[name],
              functions: functions[name]
            })
          })
        }
      })
    }
  } catch (err) {
    console.error(err)
  }

  run()
})()
