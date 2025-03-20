import {describe, it as spec, mock} from "node:test";
import {observeableGrip, valueGrip} from "./grip";
import assert from "node:assert/strict";

describe('observeableGrip', () => {
  spec('can observe a change', async () => {
    const myGrip = observeableGrip(valueGrip<string>('foo'))

    const onChangeSpy = mock.fn()

    myGrip.addObserver(onChangeSpy, {observeInitialValue: true})

    await new Promise(r => setTimeout(r, 5))

    assert.equal(onChangeSpy.mock.calls.length, 1)
    assert.equal(myGrip.value, 'foo')
  })

  spec('can observe initial value', () => {
    const myGrip = observeableGrip(valueGrip<string>('foo'))

    const onChangeSpy = mock.fn()

    myGrip.addObserver(onChangeSpy)
    myGrip.set('bar')

    assert.equal(onChangeSpy.mock.calls.length, 1)
    assert.equal(myGrip.value, 'bar')
  })
  spec('can remove an observer', () => {
    const myGrip = observeableGrip(valueGrip<string>('foo'))

    const onChangeSpy = mock.fn()

    const remover = myGrip.addObserver(onChangeSpy)
    remover()

    myGrip.set('bar')

    assert.equal(onChangeSpy.mock.calls.length, 0)
  })
  spec('can observe multiple changes', () => {
    const myGrip = observeableGrip(valueGrip<string>('foo'))

    const onChangeSpy = mock.fn()
    myGrip.addObserver(onChangeSpy)

    myGrip.set('bar')
    myGrip.set('baz')
    myGrip.set('buzz')

    assert.equal(onChangeSpy.mock.calls.length, 3)
  })
  spec('multiple observers', () => {
    const myGrip = observeableGrip(valueGrip<string>('foo'))

    const onChangeSpy1 = mock.fn()
    const onChangeSpy2 = mock.fn()

    myGrip.addObserver(onChangeSpy1)
    myGrip.addObserver(onChangeSpy2)

    myGrip.set('bar')

    assert.equal(onChangeSpy1.mock.calls.length, 1)
    assert.equal(onChangeSpy2.mock.calls.length, 1)
  })
})


describe('observable', () => {
  spec('can observe a change', async () => {
    const myGrip = valueGrip<string>('foo').observable

    const onChangeSpy = mock.fn()

    myGrip.addObserver(onChangeSpy, {observeInitialValue: true})

    await new Promise(r => setTimeout(r, 5))

    assert.equal(onChangeSpy.mock.calls.length, 1)
    assert.equal(myGrip.value, 'foo')
  })

  spec('can observe initial value', () => {
    const myGrip = valueGrip<string>('foo').observable

    const onChangeSpy = mock.fn()

    myGrip.addObserver(onChangeSpy)
    myGrip.set('bar')

    assert.equal(onChangeSpy.mock.calls.length, 1)
    assert.equal(myGrip.value, 'bar')
  })
  spec('can remove an observer', () => {
    const myGrip = valueGrip<string>('foo').observable

    const onChangeSpy = mock.fn()

    const remover = myGrip.addObserver(onChangeSpy)
    remover()

    myGrip.set('bar')

    assert.equal(onChangeSpy.mock.calls.length, 0)
  })
  spec('can observe multiple changes', () => {
    const myGrip = valueGrip<string>('foo').observable

    const onChangeSpy = mock.fn()
    myGrip.addObserver(onChangeSpy)

    myGrip.set('bar')
    myGrip.set('baz')
    myGrip.set('buzz')

    assert.equal(onChangeSpy.mock.calls.length, 3)
  })
  spec('multiple observers', () => {
    const myGrip = valueGrip<string>('foo').observable

    const onChangeSpy1 = mock.fn()
    const onChangeSpy2 = mock.fn()

    myGrip.addObserver(onChangeSpy1)
    myGrip.addObserver(onChangeSpy2)

    myGrip.set('bar')

    assert.equal(onChangeSpy1.mock.calls.length, 1)
    assert.equal(onChangeSpy2.mock.calls.length, 1)
  })
})
