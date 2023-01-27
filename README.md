# shacl-engine

[![build status](https://img.shields.io/github/actions/workflow/status/bergos/shacl-engine/test.yaml?branch=master)](https://github.com/bergos/shacl-engine/actions/workflows/test.yaml)
[![npm version](https://img.shields.io/npm/v/shacl-engine.svg)](https://www.npmjs.com/package/shacl-engine)

A fast [SHACL](https://www.w3.org/TR/shacl/) engine for data provided as [RDF/JS](http://rdf.js.org/data-model-spec/) objects.

## Features

SHACL consists of multiple modules.
Here is an overview of the features this library implements and planned features:

- [X] [SHACL Validation](https://www.w3.org/TR/shacl/#validation)
  - [X] [SHACL Core Constraint Components](https://www.w3.org/TR/shacl/#core-components)
  - [ ] [SHACL SPARQL-based Constraints](https://www.w3.org/TR/shacl/#sparql-constraints)
- [ ] [SHACL JavaScript Extensions](https://www.w3.org/TR/shacl-js/)
- [ ] [SHACL Advanced Features](https://w3c.github.io/shacl/shacl-af/)

## Install

```bash
npm install --save shacl-engine
```

## Usage

### Validator

The `Validator` class can be imported from the main package:

```javascript
import { Validator } from 'shacl-engine'
```

Or from the class file:

```javascript
import Validator from 'shacl-engine/Validator.js'
```

The constructor must be called with the shapes as an RDF/JS [DatasetCore](https://rdf.js.org/dataset-spec/#datasetcore-interface) object.
The second argument is an object for various options:

- `coverage`: Boolean flag to enable collecting covered quads. (*optional*)
  If coverage is enabled, `debug` and `details` are also enabled.
- `debug`: Generate debug results for successful validations. (*optional*)
- `details`: Generate nested result details. (*optional*)
- `factory`: A RDF/JS [DataFactory](http://rdf.js.org/data-model-spec/#datafactory-interface), which is used to generate the report (*required*).

The validations can be executed with the `.validate(data, shapes)` method.
The data must have the following structure:

- `dataset`: An RDF/JS [DatasetCore](https://rdf.js.org/dataset-spec/#datasetcore-interface) object that contains the quads. (*required*)
- `terms`: An iterable object of RDF/JS [Terms](http://rdf.js.org/data-model-spec/#term-interface) that will be used as initial focus nodes. (*optional*)

The shapes object is optional, but if given must have the following structure:

- `terms`: An iterable object of RDF/JS [Terms](http://rdf.js.org/data-model-spec/#term-interface) that refers to the initial set of shapes. (*optional*)
  This doesn't limit the nested shapes.

#### Example

The following example reads the shapes and data from the list coverage test, creates a `Validator` instance, and runs the validation:

```javascript
import rdfDataModel from '@rdfjs/data-model'
import rdfDataset from '@rdfjs/dataset'
import toNT from '@rdfjs/to-ntriples'
import fromFile from 'rdf-utils-fs/fromFile.js'
import Validator from 'shacl-engine/Validator.js'

async function main () {
  // read the shape and data from the list coverage test
  const filename = new URL('../test/assets/coverage/list.ttl', import.meta.url)
  const dataset = rdfDataset.dataset()

  for await (const quad of fromFile(filename.pathname)) {
    dataset.add(quad)
  }

  // create a validator instance for the shapes in the given dataset
  const validator = new Validator(dataset, { factory: rdfDataModel })

  // run the validation process
  const report = await validator.validate({ dataset })

  // check if the data conforms to the given shape
  console.log(`conforms: ${report.conforms}`)
}

main()
```

See the `examples` folders for more examples.
