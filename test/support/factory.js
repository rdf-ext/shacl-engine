import DataModelFactory from '@rdfjs/data-model/Factory.js'
import DatasetFactory from '@rdfjs/dataset/Factory.js'
import Environment from '@rdfjs/environment'
import TermSetFactory from '@rdfjs/term-set/Factory.js'
import TraverserFactory from '@rdfjs/traverser/Factory.js'
import GrapoiFactory from 'grapoi/Factory.js'

const factory = new Environment([
  DataModelFactory,
  DatasetFactory,
  GrapoiFactory,
  TermSetFactory,
  TraverserFactory
])

export default factory
