Given a function, creates a new function with built-in retry capabilities.

## Example
```ts
import { retryable } from 'ts-retryable'
import nodeFetch from "node-fetch";

export const myFetch = retryable(nodeFetch, {
   shouldRetry: (count => count < 3),
   delay: 5000
})
// Elsewhere, use this `myFetch` but get automatic retries.
```
In my code, the `shouldRetry` became fairly sophisticated, analyzing not only the retry count, but the details of the error that was thrown.

This will work with any async function, and I developed for an API-heavy app. Dropbox was one of the APIs, and here's a slightly more complex example (although simplified a bit):

```ts
dropboxApi.filesDownload = makeRetryable(
   dropboxApi.filesDownload, 
   {
     shouldRetry: async function (count: number, e: DropboxResponse<files.FileMetadata>): Promise<boolean> {
         if (count >= 4) return false
         if (e.status === 401) {
            await client.refreshAccessToken()
            return true
          }
         return isNetworkError(e);
      },
     delay: 5000,
   })
```
You can use this with functional composition. I composed this with other code that handled the OAuth details.

## Details    

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


## Other Libs

Lots of these solutions are (1) not Typescript (2) function specific, such as `fetch` only. Feel free to try any of them.

- https://github.com/jonbern/fetch-retry nice version
- https://www.chrisarmstrong.dev/posts/retry-timeout-and-cancel-with-fetch
- https://github.com/poetic/retryable-promise
- https://github.com/valeriangalliat/promise-retryable
- https://www.npmjs.com/package/keep-trying
