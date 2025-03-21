import {describe, it as spec} from "node:test";
import assert from "node:assert/strict";

import {valueGrip} from "./valueGrip";

describe('valueGrip', () => {
  spec('can store numbers', () => {
    assert.equal(valueGrip(1).value, 1)
    assert.equal(valueGrip(2).value, 2)
  })
  spec('can store objects', () => {
    assert.deepEqual(valueGrip({one: 1, two: [1, 2, 3], 3: 'tree'}).value, {one: 1, two: [1, 2, 3], 3: 'tree'})
  })
  spec('can change values', () => {
    const a = valueGrip('foo')
    assert.equal(a.value, 'foo')
    a.set('bar')
    assert.equal(a.value, 'bar')
    a.set('baz')
    assert.equal(a.value, 'baz')
  })
})
