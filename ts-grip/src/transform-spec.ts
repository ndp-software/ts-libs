import {describe, it as spec} from "node:test";
import assert from "node:assert/strict";
import {transformGrip} from "./transformGrip";
import {valueGrip} from "./valueGrip";

import {isPromise} from "./util";

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

  spec('can transform async values', async () => {
    const grip1 = valueGrip(Promise.resolve('a'))
    const grip2 = transformGrip(grip1, {
      in: (v: Promise<number>) => v.then(v => v.toString(16)),
      out: (v: Promise<string>) => v.then(v => parseInt(v, 16))
    })

    assert.equal(await grip2.value, 10)
    assert.equal(await grip1.value, 'a')

    await grip2.set(Promise.resolve(15))
    assert.equal(await grip2.value, 15)
    assert.equal(await grip1.value, 'f')

    await grip2.set(Promise.resolve(1965))
    assert.equal(await grip2.value, 1965)
    assert.equal(await grip1.value, '7ad')
  })
  spec('can transform non-promise values', async () => {
    const grip1 = valueGrip(Promise.resolve('a'))
    const grip2 = transformGrip(grip1, {
      in: (v: Promise<number>|number) => isPromise(v)
        ? v.then(v => v.toString(16))
        : Promise.resolve(v.toString(16)),
      out: (v: Promise<string>) => v.then(v => parseInt(v, 16))
    })

    assert.equal(await grip2.value, 10)
    assert.equal(await grip1.value, 'a')

    await grip2.set(Promise.resolve(15))
    assert.equal(await grip2.value, 15)
    assert.equal(await grip1.value, 'f')

    await grip2.set(1965)
    assert.equal(await grip2.value, 1965)
    assert.equal(await grip1.value, '7ad')
  })

})
