# @adrianhelvik/mock

[![Build Status](https://travis-ci.org/adrianhelvik/mock.svg?branch=master)](https://travis-ci.org/adrianhelvik/mock)
[![Coverage Status](https://coveralls.io/repos/github/adrianhelvik/mock/badge.svg?branch=master)](https://coveralls.io/github/adrianhelvik/mock?branch=master)

I have now been using and loving this module for some time,
so I decided to write some docs and share it with the world!

## When to use this module
- When you do not need IE11 support for your tests
- When you want a universal mocker and stubber

## What you can do with this module
- Access any deeply nested property and receive a new mock object
- Call it as a function
- Set a property to be some value
- Determine what arguments a mock or a nested is called with
- Await it

## Example

```javascript
import mock from '@adrianhelvik/mock'

const m = mock()

m.x.y('Hello world').z('How are you')

expect(m.x.y.$args[0]).toEqual(['Hello world'])
expect(m.x.y.z.$args[0]).toEqual(['How are you'])

m.message = 'cool brah'
expect(m.message).toEqual('cool brah')

m.fn = (who) => 'Hello ' + who

expect(m.fn('you!')).toEqual('Hello you!')
expect(m.fn('someone!')).toEqual('Hello someone!')
expect(m.fn.$args[0]).toEqual(['you!'])
expect(m.fn.$args[1]).toEqual(['someone!'])
```

## API

### mock()

This creates a mock object. All properties are unique and preserved
mock objects as well. Calling the mock as a function returns a
preserved mock object as well.

```javascript
const m = mock()

expect(m.foo).toBe(m.foo)
expect(m()).toBe(m())
expect(m()).not.toBe(m)
```

### $args
This property resolves to an array containing the lists
of arguments for calls to this mock.

Given the following calls:

```javascript
const m = mock()
m.foo(1, 2, 3)
m.foo(4, 5, 6)
```

.. we would get the following array when accessing `m.foo.$args`:

```javascript
[
  [1, 2, 3],
  [4, 5, 6],
]
```

### $isMock
This property returns true for any mock object.

```javascript
const m = mock()

m.$isMock === true
m.foo.isMock === true
m.bar().$isMock === true
```

### $reset()
Reset $args for all child mocks.

```javascript
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
```

### Promise resolution

If a mocked value is used as a promise, that's accounted for
the then property returns an asynchronously resolved promise.

The promise resolves to undefined.

The good part about this is that you can use async/await and
not worry about a thing!

```javascript
expect(typeof mock().then).toBe('function')
const resolvedTo = await mock()
expect(resolvedTo).toBe(undefined)
```

Se the tests for further info. Supports catch binding as well.

### $throws
If you want a promise to fail, you can set `m.$throws = true`.

```javascript
const m = mock()
m.$throws = true

m.foo.bar()
  .then(() => done.fail('Should not succeed!')
  .catch(error => done())
```

### Assignment
You can assign properties to a mock object. This is often
very useful in testing.

```javascript
const m = mock()

m.meaning.of.life = 42
expect(m.meaning.of.life).toBe(42)
```

#### Assigning functions to a mock gives you access to $args
When assigning functions as a property of a mock, you will also
have access to `$args` of this function.

Note that the function will lose equality with the original
function as it is proxied.

```javascript
const m = mock()

const mockEncrypt = password => 'secret:' + password
m.encrypt = mockEncrypt
const encrypted = m.encrypt('my password')

// it uses the mock function
expect(encrypted).toEqual('secret:my password')
// and you have access to $args
expect(m.encrypt.$args[0]).toEqual(['my password'])
// , but it does not point to the same object anymore
expect(m.encrypt).not.toBe(mockEncrypt)
```

### Reassigning .then

You can reassign then for testing custom thenables. You must
however remember to call the received function for the promise
to resolve.

```javascript
const m = mock()
let called = false

m.then = function (fn) {
  called = true
  fn()
}

await m

expect(called).toBe(true)
```

# Changelog

## v3.0.0 

### Made function calling optional when retrieving $args from a nested function
```javascript
const m = mock()
m.foo(1).bar(2)
expect(m.foo.bar.$args).toBe(m.foo().bar.$args)
```

## v3.3.0
- Added .$reset() method to reset .$args for current and child mocks.
