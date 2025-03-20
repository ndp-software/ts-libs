import {describe, it as spec} from "node:test";
import {transformGrip, valueGrip} from "./grip";
import assert from "node:assert/strict";

describe('transformGrip', () => {
  spec('can convert from String to Int', () => {
    const grip1 = valueGrip('a')
    const grip2 = transformGrip(grip1, {
      in: (v: number) => v.toString(16),
      out: (v: string) => parseInt(v, 16)
    })

    assert.equal(grip2.value, 10)
    assert.equal(grip1.value, 'a')
  })
  spec('can change outer grip', () => {
    const grip1 = valueGrip('a')
    const grip2 = transformGrip(grip1, {
      in: (v: number) => v.toString(16),
      out: (v: string) => parseInt(v, 16)
    })

    grip2.set(15)
    assert.equal(grip2.value, 15)
    assert.equal(grip1.value, 'f')

    grip2.set(1965)
    assert.equal(grip2.value, 1965)
    assert.equal(grip1.value, '7ad')
  })
  spec('can change inner grip', () => {
    const grip1 = valueGrip('a')
    const grip2 = transformGrip(grip1, {
      in: (v: number) => v.toString(16),
      out: (v: string) => parseInt(v, 16)
    })

    grip1.set('f')
    assert.equal(grip2.value, 15)
    assert.equal(grip1.value, 'f')

    grip1.set('7ad')
    assert.equal(grip2.value, 1965)
    assert.equal(grip1.value, '7ad')
  })
})
