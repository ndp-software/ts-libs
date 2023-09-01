import {sleep} from "./promise";
/*
Retries are evaluated based on which retry it is (starting at 1),
and, if you want, the exception that was thrown.
 */
type ShouldRetryParams<E = unknown> = [count: number, exceptionThrown: E]

interface Options<E = unknown> {
  shouldRetry: (...args: ShouldRetryParams<E>) => PromiseLike<boolean> | boolean,
  delay?: number | ((...args: ShouldRetryParams<E>) => number)
}


/**
 * Given a function, returns a new function with built-in retry capabilities.
 * Failure for sync functions means throwing an exception, and
 * failure for Promise/async functions means returning a rejected promise.
 *
 * The retry capabilities are controlled by the options provided:
 *
 * -  `shouldRetry` is a function you provide that determines whether a
 *    failure will retry. It receives the retry count (starting at 1), and
 *    the exception that was thrown/rejected, and should returns true or false.
 *    Although it's possible to retry "forever" (pass `() => true`), a better
 *    choice might be some sort of retry limit such as `(c) => c < 5`, or
 *    based on a specific exception, such as `(c,e) => e.status === 503`.
 *
 *    Although this function is basically function asking for true/false,
 *    it is possible to execute other logic, including side effects.
 *    This could be any sort of "extra" logic to prepare for a retry.
 *
 * -  `delay` is how long to wait before retrying. By default there is no delay,
 *    but you can provide a number (of milliseconds), or a function, which
 *    could implement exponential backoff ala `(c) => Math.pow(2, c) * 1000`
 *    or some other mechanism.
 */
export function retryable<
  This,
  Args extends Array<unknown>,
  RetType,
  Except = unknown
>(
  target: (this: This, ...args: Args) => Promise<RetType>,
  options: Options<Except>
): (this: This, ...args: Args) => Promise<RetType> {

  // Return a new function with the same signature...
  return function (this: This, ...args: Args): Promise<RetType> {

    let callCount = 0

    const callTarget = async (): Promise<RetType> => {

      callCount++

      try {
        return target.call(this, ...args).catch(onException);
      } catch (e) {
        return onException(e as Except)
      }

      async function onException(e: Except) {

        const retry = await options.shouldRetry(callCount, e);

        if (!retry) throw e

        await delay(callCount, e)
        return callTarget() // mutual recursion
      }

    };

    return callTarget()
  }

  function delay(callCount: number, e: Except) {
    const ms = typeof options.delay === 'function'
      ? options.delay(callCount, e)
      : (options.delay || 0)

    return sleep(ms)
  }

}



