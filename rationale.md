$path
=====

This is a document where I attempt to figure out how to implement $path
properly. This is a WIP and might never be implemented.

let x be a mock

```javascript
let x = mock()

let a = x.foo.bar
let b = x.foo.biz
let c = x.foo.bar

a.biz
b.bax
c.box
```

### Intermediate stage 1
- foo [1]
    - bar [1]

- foo [2]
    - biz [2]

- foo [3]
    - bar [3]

- [1] -> biz [1]
- [2] -> bax [2]
- [3] -> box [3]

### Intermediate stage 2

#### Immagined
- foo ([1, 2, 3])
    - bar ([1, 3])
        - biz [1]
        - bix [3]
    - biz ([2])
        - box [2]

#### Actual
- foo [1]
    - bar [1]
        - biz [1]
        - bix [3] # foo.bar has children, so root.nextId() is called
    - biz [2]
        - box [2]

### Desired outcome
```
[
  ['foo', 'bar', 'biz'],
  ['foo', 'biz'],
  ['foo', 'bar', 'box']
]
```

Recipe
------

- mock() creates a RootMock instance and wraps it in a proxy
- Path 1
    - [key: 'foo']
        - Create a ChildMock instance
        - Since parent is root, set pathId to rootMock.genId()
        - set rootProxy.paths[pathId] to an empty array
        - add current 
    - [key: 'bar']
        - Since parent is #1, set pathId to #1
        - Add n

Class
-----

```javascript
class RootMock {
  idCounter = 0
  paths = {}

  genId() {
    return ++this.idCounter
  }

  access(property) {
    if (! this.paths[property]) {
      this.paths[property] = new ChildMock(this, property)
    }

    return this.paths[property]
  }
}

class ChildMock {
  constructor(rootMock, property) {
  }

  access(property) {
  }
}

const mock = new RootMock()

mock.access('foo')
```
