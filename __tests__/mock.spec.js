// @ts-check

const mock = require('../lib/mock')

describe('mock', () => {
  test('you can access deep properties', () => {
    expect(() => {
      mock().foo.bar
    }).not.toThrow()
  })

  test('the objects are preserved for objects', () => {
    const m = mock()

    expect(m.foo.bar).toBe(m.foo.bar)
  })

  test('the objects returned by the same functions are equal', () => {
    const m = mock()

    expect(m.foo()).toBe(m.foo())
  })

  test('you can call any properties as a functions', () => {
    expect(() => {
      mock().foo.bar.x.y.z()
    }).not.toThrow()
  })

  describe('$isMock', () => {
    test('mocks have the $isMock property set to true', () => {
      const m = mock()

      expect(m.foo.bar.$isMock).toBe(true)
    })
  })

  describe('function calls', () => {
    test('the functions return new proxies', () => {
      const m = mock()

      expect(m.foo().$isMock).toBe(true)
    })
  })

  describe('$args', () => {
    test('it returns an empty array if no call was made', () => {
      const m = mock()

      expect(m.foo.bar.$args).toEqual([])
    })

    test('you can determine what a simple function was called with', () => {
      const m = mock()

      m('foobar')

      expect(m.$args[0]).toEqual(['foobar'])
    })

    test('you can determine what a nested function was called with', () => {
      const m = mock()

      m.foo('foobar')

      expect(m.foo.$args[0]).toEqual(['foobar'])
    })

    test('you can get the args for multiple previous calls', () => {
      const m = mock()

      m.foo(1, 2, 3)
      m.foo(4, 5, 6)

      expect(m.foo.$args).toEqual([[1, 2, 3], [4, 5, 6]])
    })
  })

  test('you can determine what each function was called with', () => {
    const m = mock()

    m.foo.bar('Hello world').biz.baz('Yep')

    expect(m.foo.bar.$args).toEqual([['Hello world']])
    expect(m.foo.bar().biz.baz.$args).toBe(m.foo.bar.biz.baz.$args)
    expect(m.foo.bar.biz.baz.$args).toEqual([['Yep']])
  })

  test('you can specify nested functions', () => {
    const m = mock()

    m.foo.bar = name => 'Hello ' + name

    expect(m.foo.bar('world')).toBe('Hello world')
  })

  test('you can get nested function args', () => {
    const m = mock()

    m.foo.bar = name => 'Hello ' + name
    m.foo.bar('world')
    m.foo.bar('cool')

    expect(m.foo.bar.$args).toEqual([
      ['world'],
      ['cool']
    ])
  })

  test('you can specify specific values', () => {
    const m = mock()

    m.foo.bar = 'Hello world'

    expect(m.foo.bar).toBe('Hello world')
  })

  describe('Promise integration', () => {
    test('you can call await on the mock', async () => {
      const m = mock()
      await m.foo.bar()
    })

    test('you can call .then on the mock', async () => {
      const m = mock()
      let called = false

      m.then(() => {
        called = true
      })

      await new Promise(resolve => {
        setTimeout(async () => {
          resolve(undefined)
        })
      })

      expect(called).toBe(true)
    })

    test('you can call .catch on the mock', (done) => {
      const m = mock()
      m.$throws = true
      m.foo.bar.catch(() => {
        done()
      })
    })

    test('you can get the $throws property', () => {
      const m = mock()
      m.$throws = true
      expect(m.$throws).toBe(true)
    })

    test('you can call both .then and .catch on the mock for a non-erroring promise', (done) => {
      const m = mock()

      let called = {
        then: false,
        catch: false,
      }

      const check = () => {
        if (called.catch)
          done.fail(Error('Expected then not to be called'))
        else
          done()
      }

      m.foo.bar
        .then(() => {
          called.then = true
          setTimeout(check)
        })
        .catch(() => {
          called.catch = true
          setTimeout(check)
        })
    })

    test('you can call both .then and .catch on the mock for a erroring promise', (done) => {
      const m = mock()
      m.$throws = true

      let called = {
        then: false,
        catch: false,
      }

      const check = () => {
        if (called.then)
          done.fail(Error('Expected then not to be called'))
        else
          done()
      }

      m.foo.bar
        .then(() => {
          called.then = true
          setTimeout(check)
        })
        .catch(() => {
          called.catch = true
          setTimeout(check)
        })
    })

    test('it handles promises after the current event loop run for values', () => {
      const m = mock()

      let called = false
      m.foo.bar.then(() => {
        called = true
      })
      expect(called).toBe(false)
    })

    test('you can reassign .then', async () => {
      const m = mock()
      let called = false

      /**
       * @param {() => void} fn
       */
      m.then = function (fn) {
        called = true
        fn()
      }

      await m

      expect(called).toBe(true)
    })
  })

  describe('docs', () => {
    test('example', () => {
      const foobar = mock()
      foobar.x.y('Hello world').z('How are you')
      foobar.message = 'cool brah'
      /**
       * @param {string} who
       */
      foobar.fn = (who) => 'Hello ' + who

      expect(foobar.x.y.$args[0]).toEqual(['Hello world'])
      expect(foobar.x.y.z.$args[0]).toEqual(['How are you'])
      expect(foobar.message).toEqual('cool brah')
      expect(foobar.fn('you!')).toEqual('Hello you!')
      expect(foobar.fn('someone!')).toEqual('Hello someone!')
      expect(foobar.fn.$args[0]).toEqual(['you!'])
      expect(foobar.fn.$args[1]).toEqual(['someone!'])
    })

    describe('API', () => {
      test('mock()', () => {
        const m = mock()

        expect(m.foo).toBe(m.foo)
        expect(m()).toBe(m())
        expect(m()).not.toBe(mock)
      })

      describe('Assignment', () => {
        test('Assigning functions to a mock gives you access to $args', () => {
          const m = mock()

          /**
           * @param {string} password
           */
          const mockEncrypt = password => 'secret:' + password
          m.encrypt = mockEncrypt
          const encrypted = m.encrypt('my password')

          // it uses the mock function
          expect(encrypted).toEqual('secret:my password')
          // and you have access to $args
          expect(m.encrypt.$args[0]).toEqual(['my password'])
          // , but it does not point to the same object anymore
          expect(m.encrypt).not.toBe(mockEncrypt)
        })
      })
    })
  })

  describe('Changelog', () => {
    test('v3.0.0', () => {
      const m = mock()
      m.foo(1).bar(2)
      expect(m.foo.bar.$args).toBe(m.foo().bar.$args)
    })

    describe('3.3.0', () => {
      test('you can reset all $args on children of a mock by calling someMock.$reset()', () => {
        const a = mock()

        // Parents are left unchanged
        //   |
        //   |____
        //   |    |
        //   v    v
        /**/ a(1).b(2).c(3).d(4).e(5)
        //             ^    ^    ^
        //             |____|____|
        //                  |
        //      Target and children are reset

        a.b.c.$reset()

        const b = a.b
        const c = b.c
        const d = c.d
        const e = d.e

        // Parents are left unchanged
        for (const x of [a, b])
          expect(x.$args.length).toBe(1)

        // Target and children are reset
        for (const x of [c, d, e])
          expect(x.$args.length).toBe(0)
      })
    })
  })
})
