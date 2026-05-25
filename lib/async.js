async function every (items, func, all = false) {
  let result = true

  for (const item of items) {
    if (!await func(item)) {
      result = false

      if (!all) {
        break
      }
    }
  }

  return result
}

async function exactlyOne (items, func, all = false) {
  let count = 0

  for (const item of items) {
    if (await func(item)) {
      count++

      if (count > 1 && !all) {
        break
      }
    }
  }

  return count === 1
}

async function filter (items, func) {
  return (await Promise.all(items.map(item => func(item)))).filter(Boolean)
}

async function map (items, func) {
  return Promise.all(items.map(func))
}

async function some (items, func, all = false) {
  let result = false

  for (const item of items) {
    if (await func(item)) {
      result = true

      if (!all) {
        break
      }
    }
  }

  return result
}

export {
  every,
  exactlyOne,
  filter,
  map,
  some
}
