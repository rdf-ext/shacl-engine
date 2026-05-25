function validateEach (validateList) {
  return async context => {
    for (const validate of validateList) {
      await validate(context)
    }
  }
}

export {
  validateEach
}
