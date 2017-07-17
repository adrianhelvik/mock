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

  describe('$parent', () => {
    test('the parent property refers to the previous part of the access chain', () => {
      const m = mock()

      expect(m.foo.bar.car.$parent).toBe(m.foo.bar)
    })
  })

  test('you can determine what each function was called with', () => {
    const m = mock()

    m.foo.bar('Hello world').biz.baz('Yep')

    expect(m.foo.bar.$args[0]).toEqual(['Hello world'])
    expect(m.foo.bar().biz.baz.$args[0]).toEqual(['Yep'])
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
      const fn = mock()
      let called = false

      m.then(() => {
        called = true
      })

      await new Promise(resolve => {
        setTimeout(async () => {
          resolve()
        })
      })

      expect(called).toBe(true)
    })

    test('it handles promises after the current event loop run for values', () => {
      const m = mock()

      let called = false
      m.foo.bar.then(() => {
        called = true
      })
      expect(called).toBe(false)
    })
  })

  describe('$path', () => {
    it('logs property lookups', () => {
      const m = mock()

      m.foo.bar.biz.baz

      expect(m.$path).toEqual([
        ['foo', 'bar', 'biz', 'baz']
      ])
    })

    it('logs function calls', () => {
      const m = mock()

      m.bar(1)

      expect(m.$path[0]).toEqual(['bar', [1]])
    })

    it('logs all property lookups from the base proxy', () => {
      const m = mock()

      m.foo.bar
      m.biz.baz

      expect(m.$path).toEqual([
        ['foo', 'bar'],
        ['biz', 'baz']
      ])
    })

    it('logs property lookups non-sequentially', () => {
      const m = mock()

      let A = m.a.b
      let B = m.e.f

      A.c.d
      B.g.h

      expect(m.$path).toEqual([
        ['a', 'b', 'c', 'd'],
        ['e', 'f', 'g', 'h'],
      ])
    })

    it('logs function calls non-sequentially', () => {
      const m = mock()

      let A = m.a('b')
      let B = m.e('f')

      A.c('d')
      B.g('h')

      expect(m.$path).toEqual([
        ['a', ['b'], 'c', ['d']],
        ['e', ['f'], 'g', ['h']],
      ])
    })
  })
})
