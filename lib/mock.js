module.exports = function () {
  return mock()
}

function mock (parentProxy, $throws = false) {
  let children = []

  const proxy = new Proxy(fn, {
    get(target, key) {
      switch (key) {
        case '$isMock':
          return true
        case '$args':
          if (! target.$args) target.$args = []
          return target.$args
        case '$throws':
          return $throws
        case '$reset':
          return () => {
            target.$args = null
            for (const child of children) {
              child.$reset()
            }
          }
        case 'then':
          if (typeof target.then === 'function')
            return target.then
          if (! $throws) {
            return (handler) => {
              process.nextTick(handler)
              return proxy
            }
          }
          return proxy
        case 'catch':
          if ($throws) {
            return (handler) => {
              process.nextTick(handler)
              return proxy
            }
          }
          return proxy
        default:
          break
      }

      if (! (key in target)) {
        const child = fn()
        children.push(child)
        target[key] = child
      }

      return target[key]
    },
    set(target, key, value) {
      if (key === '$throws') {
        $throws = value
        return true
      }

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
    return mock(proxy, $throws)
  }

  return proxy
}
