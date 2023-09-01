import {retryable} from "./retryable";
import {asyncCycle, rejectNTimesThenResolve} from "./spec-helpers";
import assert from "node:assert";
import {describe, afterEach, mock, it as specify} from "node:test";
import {sleep} from "./promise";


describe('retryable', () => {

  const options = {shouldRetry: (e: any) => false}
  const alwaysThrow = function () {
    throw 'an exception'
  }

  const alwaysReject = function (): Promise<void> {
    throw 'an exception'
  }


  afterEach(() => {
    mock.reset()
    mock.timers.reset()
  })

  specify('returns original function result', async () => {
    const wrapped = retryable(async () => 'foo', options)

    const result = await wrapped()

    assert.equal(result, 'foo')
  })

  specify('does not call `shouldRetry` option if promise resolves', async () => {
    const wrapped = retryable(async () => 'foo', options)
    const spy = mock.method(options, 'shouldRetry')

    await wrapped()

    assert.equal(spy.mock.calls.length, 0)
  })

  specify('preserves "this" on initial call', async () => {
    const api = {
      doItRemotely: (a: number) => Promise.resolve(a + 1)
    }
    const spy = mock.method(api, 'doItRemotely')

    api.doItRemotely = retryable(api.doItRemotely, options)

    const result = await api.doItRemotely(4)

    assert.equal(result, 5)
    assert.equal(spy.mock.calls[0].this, api)
  })

  specify('rejecting a promise calls `shouldRetry`', async () => {
    const retryableSpy = mock.method(options, 'shouldRetry')
    const wrapped = retryable(async () => Promise.reject('an exception'), options)

    try {
      await wrapped()
      assert.fail('should have throw exception')
    } catch (e) {
      assert.equal(retryableSpy.mock.calls.length, 1)
    }
  })

  specify('throws exception if `shouldRetry` returns false', async () => {
    const wrapped = retryable(alwaysReject, {
      ...options,
      shouldRetry: () => false
    })

    try {
      await wrapped()
      throw 'should not reach here'
    } catch (e) {
      assert.equal(e, 'an exception')
    }
  })


  specify('throws exception if `shouldRetry` returns Promise<false>', async () => {
    const wrapped = retryable(alwaysReject, {
      ...options,
      shouldRetry: () => Promise.resolve(false)
    })

    try {
      await wrapped()
      throw 'should not reach here'
    } catch (e) {
      assert.equal(e, 'an exception')
    }
  })


  specify('calls again if `shouldRetry` returns true', async () => {
    const spy = mock.fn(alwaysReject)
    const wrapped = retryable(spy, {
      ...options,
      shouldRetry: (count) => count === 1
    })

    try {
      await wrapped()
      throw 'should not reach here'
    } catch (e) {
      assert.equal(spy.mock.calls.length, 2)
      assert.equal(e, 'an exception')
    }
  })

  specify('calls again if `shouldRetry` returns Promise<true>', async () => {
    const spy = mock.fn(alwaysReject)
    const wrapped = retryable(spy, {
      ...options,
      shouldRetry: (count) => Promise.resolve(count === 1)
    })

    try {
      await wrapped()
      throw 'should not reach here'
    } catch (e) {
      assert.equal(spy.mock.calls.length, 2)
      assert.equal(e, 'an exception')
    }
  })

  specify('returns promise result after retries', async () => {
    const retrySome = function (count: number) {
      return count < 4
    }
    const retryableSpy = mock.fn(retrySome)

    const wrapped = retryable(
      asyncCycle('throw too soon', 'throw too soon', 'throw too soon',  'foo'), {
      ...options,
      shouldRetry: retryableSpy
    })

    const result = await wrapped()

    assert.equal(result, 'foo')
    assert.equal(retryableSpy.mock.calls.length, 3)
  })

  specify('returns rejected promise after exhausting retries', async () => {
    const retrySome = function (count: number) {
      return count < 3
    }
    const retryableSpy = mock.fn(retrySome)

    const wrapped = retryable(
      rejectNTimesThenResolve(10, 'foo', 'too soon'), {...options, shouldRetry: retryableSpy})

    const result = wrapped() as Promise<string>

    await result.then((_) => {
      throw 'resolved instead of rejecting'
    })
      .catch(e => {
        assert.equal(e, 'too soon');
        assert.equal(retryableSpy.mock.calls.length, 3)
      })
  })

  specify('retries alot if asked', async () => {
    const retrySome = function (count: number) {
      return count < 2000
    }
    const retryableSpy = mock.fn(retrySome)

    const wrapped = retryable(rejectNTimesThenResolve(999, 'foo', 'too soon'), {
      ...options,
      delay: 0,
      shouldRetry: retryableSpy
    })

    const result = await wrapped()

    assert.equal(result, 'foo')
    assert.equal(retryableSpy.mock.calls.length, 999)
  })

  specify('resets retry count for each call', async () => {
    const retrySome = function (count: number) {
      return count < 2
    }
    const wrapped = retryable(asyncCycle('throw me', 'a'), {...options, shouldRetry: retrySome})

    assert.deepEqual([await wrapped(), await wrapped(), await wrapped(), await wrapped(), await wrapped()],
      ['a', 'a', 'a', 'a', 'a'])
  })

  specify('waits specified delay before retrying', async () => {

    // mock.timers.enable(['setTimeout'])

    const wrapped = retryable(
      asyncCycle('throw too soon', 'zesh'), {
        ...options,
        shouldRetry: () => true,
        delay: 25
      })

    let state: 'pending'|'resolved' = 'pending'

    const promise = wrapped().then(r => { state='resolved'; return r})

    await sleep(5)
    assert.equal(state, 'pending')

    await sleep(25)
    assert.equal(state, 'resolved')
    assert.equal(await promise, 'zesh')
  })

})
