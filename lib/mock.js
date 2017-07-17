function last(array) {
  return array[array.length - 1]
}

module.exports = function mock(parentProxy) {
  let isRoot = false

  if (parentProxy) {
    fn.$path = [last(parentProxy.$path)]
  } else {
    isRoot = true
    fn.$path = []
  }

  const proxy = new Proxy(fn, {
    get(target, key) {

      // Special properties
      switch (key) {
        case '$isMock':
          return true
        case '$args':
          return target.$args || []
        case '$parent':
          return parentProxy
        case '$path':
          return target.$path
      }

      // Add path
      if (isRoot) {
        fn.$path.push([])
      }
      last(fn.$path).push(key)

      // Handle expected properties in objects
      switch (key) {
        case 'then':
          return (resolve, reject) => {
            process.nextTick(() => {
              resolve()
            })
          }
        /*
        case 'inspect':
          return fn[key]
        */
      }

      if (! target[key]) {
        target[key] = mock(proxy)
      }

      return target[key]
    },
    set(target, key, value) {
      if (typeof value === 'function') {
        value = new Proxy(value, {
          get(target, key) {
            return target[key]
          },
          apply(target, self, args) {
            if (! target.$args) {
              target.$args = []
            }
            target.$args.push(args)
            return target(...args)
          }
        })
      }
      target[key] = value
      return true
    },
    apply(target, self, args) {

      // Set initial $args
      if (! target.$args) {
        target.$args = []
      }

      if (isRoot) {
        target.$path.push([])
      }
      last(target.$path).push(args)

      // Set successive $args
      target.$args.push(args)

      // Call function
      if (! target.$functionResult)
        target.$functionResult = fn()

      return target.$functionResult
    }
  })

  function fn() {
    return mock(proxy)
  }

  return proxy
}
