import {describe, it as spec} from "node:test";
import {valueGrip, withFallbackGrip} from "./grip";
import assert from "node:assert/strict";


describe('withFallbackGrip', () => {
  spec('uses a base value', () => {
    const b = valueGrip<string>('foo')
    const o = valueGrip('bar')
    const grip = withFallbackGrip(o, b)

    assert.equal(grip.value, 'bar')
  })
  spec('uses an override value', () => {
    const b = valueGrip<string>('foo')
    const o = valueGrip(undefined)
    const grip = withFallbackGrip(o, b)

    assert.equal(grip.value, 'foo')
  })
  spec('updates just the base', () => {
    const b = valueGrip<string>('foo')
    const o = valueGrip(undefined as unknown as string)
    const grip = withFallbackGrip(o.readOnly, b)

    grip.set('bar')

    assert.equal(b.value, 'bar')
    assert.equal(o.value, undefined)

    assert.equal(grip.value, 'bar')
  })
  spec('updates just the override', () => {
    const b = valueGrip<string>('foo')
    const o = valueGrip(undefined as unknown as string)
    const grip = withFallbackGrip(o, b.readOnly)

    grip.set('bar')

    assert.equal(grip.value, 'bar')
    assert.equal(b.value, 'foo')
    assert.equal(o.value, 'bar')
  })
  spec('updates both gripes', () => {
    const b = valueGrip<string>('foo')
    const o = valueGrip(undefined as unknown as string)
    const grip = withFallbackGrip(o, b)

    grip.set('bar')

    assert.equal(grip.value, 'bar')
    assert.equal(b.value, 'bar')
    assert.equal(o.value, 'bar')
  })
})

