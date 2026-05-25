import TermMap from '@rdfjs/term-map'
import TermSet from '@rdfjs/term-set'
import { XsdValidation } from 'rdf-validation'
import * as ns from '../../namespaces.js'
import resolveClasses from '../../resolveClasses.js'

const toTermType = new TermMap([
  [ns.sh.BlankNode, new Set(['BlankNode'])],
  [ns.sh.BlankNodeOrIRI, new Set(['BlankNode', 'NamedNode'])],
  [ns.sh.BlankNodeOrLiteral, new Set(['BlankNode', 'Literal'])],
  [ns.sh.IRI, new Set(['NamedNode'])],
  [ns.sh.IRIOrLiteral, new Set(['NamedNode', 'Literal'])],
  [ns.sh.Literal, new Set(['Literal'])]
])

function compileClass (shape) {
  const classes = []

  for (const classPtr of shape.ptr.out([ns.sh.class])) {
    if (classPtr.isList()) {
      classes.push([...classPtr.list()].map(ptr => resolveClasses(ptr)))
    } else {
      classes.push(classPtr.map(ptr => resolveClasses(ptr)))
    }
  }

  return {
    node: validateClass(classes),
    value: validateClass(classes)
  }
}

function validateClass (classes) {
  return context => {
    const types = [...new TermSet(context.valueOrNode.out([ns.rdf.type]).terms)]

    for (const classSets of classes) {
      const result = classSets.some(classSet => {
        return types.some(type => classSet.has(type))
      })

      context.test(result, ns.sh.ClassConstraintComponent, { value: context.valueOrNode })
    }
  }
}

function compileDatatype (shape) {
  let datatypes

  const datatypePtr = shape.ptr.out([ns.sh.datatype])

  if (datatypePtr.isList()) {
    datatypes = new TermSet([...datatypePtr.list()].map(ptr => ptr.term))
  } else {
    datatypes = new TermSet(datatypePtr.terms)
  }

  const validation = new XsdValidation()

  return {
    node: validateDatatype(datatypes, validation),
    value: validateDatatype(datatypes, validation)
  }
}

function validateDatatype (datatypes, validation) {
  return context => {
    const result = datatypes.has(context.valueOrNode.term.datatype) &&
      validation.validateSimple(context.valueOrNode.term)

    context.test(result, ns.sh.DatatypeConstraintComponent, {
      args: { datatypes },
      message: [context.factory.literal('Value does not have datatype {$datatype}')],
      value: context.valueOrNode
    })
  }
}

function compileNodeKind (shape, context) {
  const nodeKindFunc = context.functionRegistry.compile(shape.ptr.out([ns.sh.nodeKind]))

  return {
    node: validateNodeKind(nodeKindFunc),
    value: validateNodeKind(nodeKindFunc)
  }
}

function validateNodeKind (nodeKindFunc) {
  return async context => {
    const nodeKind = await nodeKindFunc(context)
    const termTypes = new Set(nodeKind.terms.flatMap(term => [...toTermType.get(term)]))

    context.test(termTypes.has(context.valueOrNode.term.termType), ns.sh.NodeKindConstraintComponent, {
      args: { nodeKind },
      message: [context.factory.literal('Value does not have node kind {$nodeKind}')],
      value: context.valueOrNode
    })
  }
}

export {
  compileClass,
  compileDatatype,
  compileNodeKind
}
