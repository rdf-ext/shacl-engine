import ParserN3 from '@rdfjs/parser-n3'
import TermSet from '@rdfjs/term-set'
import grapoi from 'grapoi'
import Grapoi from 'grapoi/Grapoi.js'
import fromFile from 'rdf-utils-fs/fromFile.js'
import { Readable } from 'readable-stream'
import chunks from 'stream-chunks/chunks.js'
import rdf from './factory.js'
import * as ns from './namespaces.js'

const allowedReportProperties = new TermSet([
  ns.sh.alternativePath,
  ns.sh.inversePath,
  ns.sh.oneOrMorePath,
  ns.sh.zeroOrMorePath,
  ns.sh.zeroOrOnePath,
  ns.rdf.first,
  ns.rdf.rest
])

const keepReportProperties = new TermSet([
  ns.sh.detail
])

function isGrapoi (obj) {
  return obj instanceof Grapoi
}

async function loadDataset (url, options) {
  if (typeof url.value === 'string') {
    url = url.value
  }

  if (url.toString().startsWith('file:///')) {
    url = new URL(url.toString()).pathname
  }

  const dataset = rdf.dataset()

  for await (const quad of fromFile(url, options)) {
    dataset.add(quad)
  }

  return dataset
}

async function loadManifest (url) {
  const dataset = await loadDataset(url, { baseIRI: url.toString() })
  const manifest = grapoi({ dataset, factory: rdf }).hasOut(ns.rdf.type, ns.mf.Manifest)

  if (!manifest.term) {
    throw new Error(`${url} doesn't contain a manifest`)
  }

  let all = [...dataset]

  for (const include of manifest.out(ns.mf.include)) {
    const child = await loadManifest(include.value)

    all = [...all, ...child.dataset]
  }

  return grapoi({ dataset: rdf.dataset(all), factory: rdf })
}

function normalizeReport (report, expected) {
  // delete messages if expected report doesn't have any
  const resultMessages = expected
    .out(ns.sh.result)
    .out(ns.sh.resultMessage)

  const detailMessages = expected
    .out(ns.sh.result)
    .out(ns.sh.detail)
    .out(ns.sh.resultMessage)

  if (resultMessages.terms.length === 0 && detailMessages.terms.length === 0) {
    grapoi(report.ptr).node().deleteOut(ns.sh.resultMessage)
  }

  // remove implementation-specific message
  expected.node().deleteOut(ns.sh.resultMessage, rdf.literal('false', ns.xsd.boolean))

  // remove named node lists
  for (const ptr of expected.node().in(ns.rdf.first)) {
    if (ptr.term.termType === 'NamedNode') {
      ptr.deleteOut([ns.rdf.first, ns.rdf.rest])
    }
  }

  for (const ptr of expected.node().out(ns.sh.value)) {
    ptr.deleteOut([ns.rdf.first, ns.rdf.rest])
  }

  // reduce the report graph to a defined subset of properties
  return reportSubgraph().match({ dataset: expected.dataset, term: expected.term })
}

async function parseString (mediaType, content) {
  if (mediaType !== 'text/turtle') {
    throw new Error(`unknown media type: ${mediaType}`)
  }

  const parser = new ParserN3()
  const input = Readable.from(content)
  const stream = parser.import(input)

  return rdf.dataset(await chunks(stream))
}

const reportSubgraph = () => {
  const keep = new TermSet()

  return rdf.traverser(({ quad, level }) => {
    if (keepReportProperties.has(quad.predicate)) {
      keep.add(quad.object)
    }

    if (keep.has(quad.subject) || keep.has(quad.object)) {
      return true
    }

    if (allowedReportProperties.has(quad.predicate)) {
      return true
    }

    if (level < 2) {
      return true
    }

    if (level === 0 && quad.subject.termType === 'BlankNode') {
      return true
    }

    return false
  })
}

export {
  isGrapoi,
  loadDataset,
  loadManifest,
  normalizeReport,
  parseString
}
