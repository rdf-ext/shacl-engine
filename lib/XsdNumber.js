import * as ns from './namespaces.js'

class BigDecimal {
  constructor (value) {
    if (value instanceof BigDecimal) {
      this.value = value.value
    } else if (typeof value === 'string') {
      if (!/^[-+]?\d+(\.\d+)?$/.test(value)) {
        throw new Error('Invalid decimal string')
      }
      this.value = value
    } else if (typeof value === 'number') {
      this.value = value.toString()
    } else {
      throw new Error('Unsupported value type')
    }
  }

  add (other) {
    if (!(other instanceof BigDecimal)) {
      throw new Error('Argument must be an instance of BigDecimal')
    }

    const [thisInt, thisFrac = ''] = this.value.split('.')
    const [otherInt, otherFrac = ''] = other.value.split('.')

    const maxFracLength = Math.max(thisFrac.length, otherFrac.length)
    const thisNormalized = BigInt(thisInt + thisFrac.padEnd(maxFracLength, '0'))
    const otherNormalized = BigInt(otherInt + otherFrac.padEnd(maxFracLength, '0'))

    const sum = thisNormalized + otherNormalized
    const sumString = sum.toString()

    if (maxFracLength === 0) {
      return new BigDecimal(sumString)
    }

    const intPart = sumString.slice(0, -maxFracLength) || '0'
    const fracPart = sumString.slice(-maxFracLength).padStart(maxFracLength, '0')

    return new BigDecimal(`${intPart}.${fracPart}`)
  }

  toString () {
    return this.value
  }
}

class XsdNumber {
  constructor (value, datatype) {
    this.datatype = datatype

    if (datatype.equals(ns.xsd.integer)) {
      this.value = parseInt(value)
    } else if (datatype.equals(ns.xsd.decimal)) {
      this.value = new BigDecimal(value)
    } else if (datatype.equals(ns.xsd.double) || datatype.equals(ns.xsd.float)) {
      this.value = parseFloat(value)
    } else {
      throw new Error('Unsupported datatype')
    }
  }

  add (other) {
    if (this.datatype.equals(ns.xsd.decimal)) {
      if (other.datatype.equals(ns.xsd.decimal) || other.datatype.equals(ns.xsd.double) || other.datatype.equals(ns.xsd.float) || other.datatype.equals(ns.xsd.integer)) {
        return new XsdNumber(this.value.add(new BigDecimal(other.value)), ns.xsd.decimal)
      }
    }

    if (this.datatype.equals(ns.xsd.double)) {
      if (other.datatype.equals(ns.xsd.decimal) || other.datatype.equals(ns.xsd.double) || other.datatype.equals(ns.xsd.float) || other.datatype.equals(ns.xsd.integer)) {
        return new XsdNumber(this.value + parseFloat(other.value), ns.xsd.double)
      }
    }

    if (this.datatype.equals(ns.xsd.float)) {
      if (other.datatype.equals(ns.xsd.decimal) || other.datatype.equals(ns.xsd.double) || other.datatype.equals(ns.xsd.float) || other.datatype.equals(ns.xsd.integer)) {
        return new XsdNumber(this.value + parseFloat(other.value), ns.xsd.float)
      }
    }

    if (this.datatype.equals(ns.xsd.integer)) {
      if (other.datatype.equals(ns.xsd.decimal)) {
        return new XsdNumber(new BigDecimal(this.value).add(other.value), ns.xsd.decimal)
      }

      if (other.datatype.equals(ns.xsd.double)) {
        return new XsdNumber(this.value + parseFloat(other.value), ns.xsd.double)
      }

      if (other.datatype.equals(ns.xsd.float)) {
        return new XsdNumber(this.value + parseFloat(other.value), ns.xsd.float)
      }

      if (other.datatype.equals(ns.xsd.integer)) {
        return new XsdNumber(this.value + parseInt(other.value), ns.xsd.integer)
      }
    }

    throw new Error('Unsupported datatype combination for addition')
  }

  toTerm (factory) {
    return factory.literal(this.value.toString(), this.datatype)
  }
}

export default XsdNumber
