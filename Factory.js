import Engine from './Engine.js'

class Factory {
  init () {
    this.shacl = {}
    this.shacl.engine = (dataset, options) => {
      return new Engine(dataset, { ...options, factory: this })
    }
  }
}

export default Factory
