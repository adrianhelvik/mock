module.exports = function () {
  return mock()
}

function mock (parentProxy) {
  const proxy = new Proxy(fn, {
    get(target, key) {
      switch (key) {
        case '$isMock':
          return true
        case '$args':
          if (! target.$args) target.$args = []
          return target.$args
        case 'then':
          return (resolve, reject) => {
            process.nextTick(() => {
              resolve()
            })
          }
        default:
          break
      }

      if (! target[key]) {
        target[key] = fn()
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

      // Set successive $args
      target.$args.push(args)

      return proxy
    }
  })

  function fn() {
    return mock(proxy)
  }

  return proxy
}
