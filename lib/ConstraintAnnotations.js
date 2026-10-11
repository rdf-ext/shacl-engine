import TermMap from '@rdfjs/term-map'
import TermSet from '@rdfjs/term-set'
import compileDeactivated from './compileDeactivated.js'
import * as ns from './namespaces.js'

const empty = {
  deactivatedFunc: () => false,
  message: [],
  severity: null
}

function hasReifiers (ptr) {
  return ptr.dataset.match(null, ns.rdf.reifies).size > 0
}

function parse (reifier, context) {
  const deactivated = reifier.out([ns.sh.deactivated])
  const message = reifier.out([ns.sh.message])
  const severity = reifier.out([ns.sh.severity])

  // ignore reifiers without SHACL annotations
  if (deactivated.terms.length === 0 && message.terms.length === 0 && severity.terms.length === 0) {
    return null
  }

  return {
    deactivatedFunc: compileDeactivated(deactivated, context),
    message: message.terms,
    severity: severity.term || null
  }
}

/**
 * Annotations attached to the individual constraint triples of a shape via RDF 1.2 reifiers, like
 * `sh:datatype xsd:integer {| sh:message "..." |}`.
 */
class ConstraintAnnotations {
  constructor (ptr, context) {
    this.ptr = ptr
    this.byPredicate = new TermMap()

    if (!hasReifiers(ptr)) {
      return
    }

    for (const property of ptr.execute({ start: 'subject', end: 'predicate' })) {
      const reifier = property.reifier()

      if (reifier.terms.length === 0) {
        continue
      }

      const annotation = parse(reifier, context)

      if (!annotation) {
        continue
      }

      const object = property.tripleTerm().term.object

      if (!this.byPredicate.has(property.term)) {
        this.byPredicate.set(property.term, new TermMap())
      }

      this.byPredicate.get(property.term).set(object, annotation)
    }
  }

  get (predicate, object) {
    return this.byPredicate.get(predicate)?.get(object) || empty
  }

  groups (predicate) {
    const byObject = this.byPredicate.get(predicate)

    if (!byObject) {
      return [{ annotation: empty, objects: null }]
    }

    const groups = []
    const unannotated = new TermSet(this.ptr.out([predicate]).terms.filter(term => !byObject.has(term)))

    if (unannotated.size > 0) {
      groups.push({ annotation: empty, objects: unannotated })
    }

    for (const [object, annotation] of byObject) {
      groups.push({ annotation, objects: new TermSet([object]) })
    }

    return groups
  }

  static get empty () {
    return empty
  }
}

export default ConstraintAnnotations
