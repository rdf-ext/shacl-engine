import { isTrue } from '../../compare.js'
import * as ns from '../../namespaces.js'
import { validateEach } from '../../validation/utils.js'

const singleLineRegex = /^[^\f\r\n\v]*$/

function languageMatch (item, language) {
  if (!language) {
    return false
  }

  return language.slice(0, item.length) === item
}

function compileLanguageIn (shape) {
  const languageInList = [...shape.ptr.out([ns.sh.languageIn])].map(ptr => [...ptr.list()].map(item => item.value))
  const validate = validateEach(languageInList.map(languageIn => validateLanguageIn(languageIn)))

  return {
    node: validate,
    value: validate
  }
}

function validateLanguageIn (languageIn) {
  return context => {
    const result = languageIn.some(item => languageMatch(item, context.valueOrNode.term.language))

    context.test(result, ns.sh.LanguageInConstraintComponent, {
      args: { languageIn: languageIn.join(', ') },
      message: [context.factory.literal('Language does not match any of {$languageIn}')],
      value: context.valueOrNode
    })
  }
}

function compileMaxLength (shape) {
  const maxLengths = shape.ptr.out([ns.sh.maxLength]).values.map(value => parseInt(value))
  const maxLength = Math.min(...maxLengths)

  return {
    node: validateMaxLength(maxLength),
    value: validateMaxLength(maxLength)
  }
}

function validateMaxLength (maxLength) {
  return context => {
    const result = context.valueOrNode.term.termType !== 'BlankNode' && context.valueOrNode.value.length <= maxLength

    context.test(result, ns.sh.MaxLengthConstraintComponent, {
      args: { maxLength },
      message: [context.factory.literal('Value has more than {$maxLength} characters')],
      value: context.valueOrNode
    })
  }
}

function compileMinLength (shape) {
  const minLengths = shape.ptr.out([ns.sh.minLength]).values.map(value => parseInt(value))
  const minLength = Math.min(...minLengths)

  return {
    node: validateMinLength(minLength),
    value: validateMinLength(minLength)
  }
}

function validateMinLength (minLength) {
  return context => {
    const result = context.valueOrNode.term.termType !== 'BlankNode' && context.valueOrNode.value.length >= minLength

    context.test(result, ns.sh.MinLengthConstraintComponent, {
      args: { minLength },
      message: [context.factory.literal('Value has less than {$minLength} characters')],
      value: context.valueOrNode
    })
  }
}

function compilePattern (shape) {
  const pattern = shape.ptr.out([ns.sh.pattern]).value
  const flags = shape.ptr.out([ns.sh.flags]).value
  const regex = new RegExp(pattern, flags)

  return {
    node: validatePattern(pattern, flags, regex),
    value: validatePattern(pattern, flags, regex)
  }
}

function validatePattern (pattern, flags, regex) {
  return context => {
    context.test(regex.test(context.valueOrNode.term.value), ns.sh.PatternConstraintComponent, {
      args: { flags, pattern },
      message: [context.factory.literal('Value does not match pattern "{$pattern}"')],
      value: context.valueOrNode
    })
  }
}

function compileSingleLine (shape) {
  const singleLine = shape.ptr.out([ns.sh.singleLine]).terms.some(term => isTrue(term))

  if (!singleLine) {
    return null
  }

  return {
    node: validateSingleLine(),
    value: validateSingleLine()
  }
}

function validateSingleLine () {
  return context => {
    context.test(singleLineRegex.test(context.valueOrNode.term.value), ns.sh.SingleLineConstraintComponent, {
      message: [context.factory.literal('Value is not a single line')],
      value: context.valueOrNode
    })
  }
}

function compileUniqueLang (shape) {
  const uniqueLang = shape.ptr.out([ns.sh.uniqueLang]).terms.some(term => isTrue(term))

  if (!uniqueLang) {
    return null
  }

  return {
    values: validateUniqueLangProperty()
  }
}

function validateUniqueLangProperty () {
  return context => {
    const result = Object.entries(context.values.terms.reduce((result, term) => {
      if (term.language) {
        result[term.language] = (result[term.language] || 0) + 1
      }

      return result
    }, {}))

    const invalid = result.filter(([, count]) => count > 1)

    for (const [lang] of invalid) {
      context.violation(ns.sh.UniqueLangConstraintComponent, {
        args: { lang },
        message: [context.factory.literal('Language "{?lang}" used more than once')]
      })
    }

    if (invalid.length === 0) {
      context.debug(ns.sh.UniqueLangConstraintComponent)
    }
  }
}

export {
  compileLanguageIn,
  compileMaxLength,
  compileMinLength,
  compilePattern,
  compileSingleLine,
  compileUniqueLang
}
