/*
Retries are evaluated based on which retry it is (starting at 1),
and, if you want, the exception that was thrown.
 */
type ShouldRetryParams<E = unknown> = [count: number, exceptionThrown: E]

interface Options<E = unknown> {
  shouldRetry: (...args: ShouldRetryParams<E>) => boolean,
}

/**
 * Given a function, returns a new function with built-in retry capabilities.
 * Failure for sync functions means throwing an exception, and
 * failure for Promise/async functions means returning a rejected promise.
 *
 * The retry capabilities are controlled by the options provided:
 *
 * -  `shouldRetry` is a function you provide that determines whether a
 *    failure will retry. It receives the call count (starting at 1), and
 *    the exception that was thrown/rejected, and should returns true or false.
 *    Although it's possible to retry "forever" (pass `() => true`), a better
 *    choice might be some sort of retry limit such as `(c) => c < 5`, or
 *    based on a specific exception, such as `(c,e) => e.status === 503`.
 *
 *    Although this function is basically function asking for true/false,
 *    it is possible to execute other logic, including side effects.
 *    This could be any sort of "extra" logic to prepare for a retry.
 *
 */

export function makeRetryableSync<
  This,
  Args extends Array<unknown>,
  RetType = void,
  Except = unknown
>(
  target: (this: This, ...args: Args) => RetType,
  options: Options<Except>
) {

  // Return a new function with the same signature...
  return function (this: This, ...args: Args): RetType {

    let callCount = 0

    const callTarget = (): RetType => {

      try {
        callCount++
        return target.call(this, ...args)
      } catch (e) {
        return onException(e as Except) as RetType
      }

      function onException(e: Except) {

        const retry = options.shouldRetry(callCount, e);

        if (!retry) throw e

        return callTarget()
      }
    };

    return callTarget()
  }
}

