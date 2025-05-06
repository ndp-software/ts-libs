import {describe, it as spec} from "node:test";
import assert from "node:assert/strict";
import {valueGrip} from "./valueGrip";
import {withFallbackGrip} from "./withFallbackGrip";


describe('withFallbackGrip', () => {
  spec('uses a base value', () => {
    const fbGrip = valueGrip<string>('foo')
    const pGrip = valueGrip('bar')
    const grip = withFallbackGrip(pGrip, fbGrip)

    assert.equal(grip.value, 'bar')
  })
  spec('uses an override value', () => {
    const fbGrip = valueGrip<string>('foo')
    const pGrip = valueGrip(undefined)
    const grip = withFallbackGrip(pGrip, fbGrip)

    assert.equal(grip.value, 'foo')
  })
  spec('uses an overide value based on function', () => {
    const pGrip = valueGrip<string>('foo')
    const fbGrip = valueGrip('bar')
    let useFallback: boolean
    const grip = withFallbackGrip(pGrip, fbGrip, () => useFallback)

    useFallback = true
    assert.equal(grip.value, 'bar')
    useFallback = false
    assert.equal(grip.value, 'foo')
  })
  spec('updates just the base', () => {
    const fbGrip = valueGrip<string>('foo')
    const pGrip = valueGrip(undefined as unknown as string)
    const grip = withFallbackGrip(pGrip.readOnly, fbGrip)

    grip.set('bar')

    assert.equal(fbGrip.value, 'bar')
    assert.equal(pGrip.value, undefined)

    assert.equal(grip.value, 'bar')
  })
  spec('updates just the override', () => {
    const fbGrip = valueGrip<string>('foo')
    const pGrip = valueGrip(undefined as unknown as string)
    const grip = withFallbackGrip(pGrip, fbGrip.readOnly)

    grip.set('bar')

    assert.equal(grip.value, 'bar')
    assert.equal(fbGrip.value, 'foo')
    assert.equal(pGrip.value, 'bar')
  })
  spec('updates both gripes', () => {
    const fbGrip = valueGrip<string>('foo')
    const pGrip = valueGrip(undefined as unknown as string)
    const grip = withFallbackGrip(pGrip, fbGrip)

    grip.set('bar')

    assert.equal(grip.value, 'bar')
    assert.equal(fbGrip.value, 'bar')
    assert.equal(pGrip.value, 'bar')
  })
})

