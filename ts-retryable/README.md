# Summary

Given a function, returns a new function with built-in retry capabilities.

The retry capabilities are controlled by the options provided:

-  `shouldRetry` is a function you provide that determines whether a
   failure will retry. It receives the retry count (starting at 1), and
   the exception that was thrown/rejected, and should returns true or false.
   Although it's possible to retry "forever" (pass `() => true`), a better
   choice might be some sort of retry limit such as `(c) => c < 5`, or
   based on a specific exception, such as `(c,e) => e.status === 503`.

   Although this function is basically function asking for true/false,
   it is possible to execute other logic, including side effects.
   This could be any sort of "extra" logic to prepare for a retry.

-  `delay` is how long to wait before retrying. By default there is no delay,
   but you can provide a number (of milliseconds), or a function, which
   could implement exponential backoff ala `(c) => Math.pow(2, c) * 1000`
   or some other mechanism.

## Async

This module assumes that the function will return a promise, as this will be 90% (or more) of the use cases. If you want to retry synchronous code, use `retryableSync` instead. It does *not* support any sort of delay, and `shouldRetry` should be sync as well. Failure for sync functions means throwing an exception, and
failure for Promise/async functions means returning a rejected promise.
