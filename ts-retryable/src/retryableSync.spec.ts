import {retryableSync} from "./retryableSync";
import {syncCycle} from "./spec-helpers";
import assert from "node:assert";
import {describe, afterEach, mock, it as specify } from "node:test";

describe('retryableSync', () => {

  const options = {shouldRetry: (e: any) => false}
  const alwaysThrow = function () {
    throw 'an exception'
  }

  afterEach(() => {
    mock.reset()
  })

  specify('returns original function result', () => {
    const wrapped = retryableSync(() => 'foo', options)

    const result = wrapped()

    assert.equal('foo', result)
  })

  specify('original function receives wrapped function’s parameters', async () => {
    const spy = mock.fn((a: number, b: string) => Promise.resolve('haha'))

    const wrapped = retryableSync(spy, options)

    const result = await wrapped(1, 'a')

    assert.equal(1, spy.mock.calls.length)
    assert.equal(1, spy.mock.calls[0].arguments[0])
    assert.equal('a', spy.mock.calls[0].arguments[1])
  })

  specify('does not call `shouldRetry` option if no error', () => {
    const wrapped = retryableSync(() => 'foo', options)
    const spy = mock.method(options, 'shouldRetry')

    wrapped()

    assert.equal(0, spy.mock.calls.length)
  })

  specify('preserves "this" on initial call', async () => {
    const api = {
      doItRemotely: (a: number) => a + 1
    }
    const spy = mock.method(api, 'doItRemotely')

    api.doItRemotely = retryableSync(api.doItRemotely, options)

    const result = api.doItRemotely(4)

    assert.equal(result, 5)
    assert.equal(spy.mock.calls[0].this, api)
  })

  specify('preserves "this" on retry', () => {
    const api = {
      alwaysThrow: alwaysThrow
    }
    const spy = mock.method(api, 'alwaysThrow')

    api.alwaysThrow = retryableSync(
      api.alwaysThrow,
      {
        shouldRetry(count: number): boolean {
          return count < 3;
        }
      })

    try {
      api.alwaysThrow()
      assert.fail('should have throw exception')
    } catch (e) {
      assert.equal(spy.mock.calls.length, 3)
      assert.equal(spy.mock.calls[0].this, api)
      assert.equal(spy.mock.calls[1].this, api)
      assert.equal(spy.mock.calls[2].this, api)
    }

  })

  specify('throwing an exception calls `shouldRetry`', () => {
    const retryableSpy = mock.method(options, 'shouldRetry')
    const wrapped = retryableSync(alwaysThrow, options)

    try {
      wrapped()
      assert.fail('should have throw exception')
    } catch (e) {
      assert.equal(1, retryableSpy.mock.calls.length)
    }
  })

  specify('throws exception if `shouldRetry` says false', () => {
    const wrapped = retryableSync(alwaysThrow, {
      ...options,
      shouldRetry: () => false
    })

    try {
      wrapped()
      throw 'should not reach here'
    } catch (e) {
      assert.equal('an exception', e)
    }
  })

  specify('calls again if `shouldRetry` returns true', () => {
    const spy = mock.fn(alwaysThrow)
    const wrapped = retryableSync(spy, {
      ...options,
      shouldRetry: (count) => count === 1
    })

    try {
      wrapped()
      throw 'should not reach here'
    } catch (e) {
      assert.equal(2, spy.mock.calls.length)
      assert.equal('an exception', e)
    }
  })

  specify('retries stop when instructed', () => {
    const retrySome = function (count: number) {
      return count < 4
    }
    const retryableSpy = mock.fn(retrySome)
    const spy = mock.fn(alwaysThrow)
    const wrapped = retryableSync(spy, {
      ...options,
      shouldRetry: retryableSpy
    })

    try {
      wrapped()
      throw 'should throw exception'
    } catch (e) {
      assert.equal(4, retryableSpy.mock.calls.length)
      assert.equal(4, spy.mock.calls.length)
      assert.equal('an exception', e)
    }
  })

  specify('resets retry count for each call', () => {
    const retrySome = function (count: number) {
      return count < 2
    }
    const wrapped = retryableSync(syncCycle('throw me', 'a'), {...options, shouldRetry: retrySome})

    assert.deepEqual([wrapped(), wrapped(), wrapped(), wrapped(), wrapped()],
      ['a', 'a', 'a', 'a', 'a'])
  })


})
