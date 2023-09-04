Given a function, creates a new function with built-in retry capabilities.
```ts
const lessFlaky = retryable(flaky, {shouldRetry: () => true})
```

## Example
```ts
import { retryable } from 'ts-retryable'
import nodeFetch from "node-fetch";

export const myFetch = retryable(nodeFetch, {
   shouldRetry: ((count, error) => count < 3),
   delay: 5000
})
// Elsewhere, use this `myFetch` but get automatic retries.
```
In my code, the `shouldRetry` became fairly sophisticated, analyzing not only the retry count, but the details of the error that was thrown.

This will work with any async function, and I developed for an API-heavy app. Dropbox was one of the APIs, and here's more realistic, but simplified example:

```ts
// import dropboxApi ...
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
I also used functional composition to produce a `fetch` that handled OAuth and network-induced errors.

## Details    

The retry capabilities are controlled by the options object provided:

-  `shouldRetry` is a function you provide that determines whether a
   failure will retry. It receives the retry count (starting at 1), and
   the exception that was thrown/rejected, and returns true or false.
   Here are common examples:
   ```ts
   () => true                  // just keep trying (forever?)
   (c) => c <= 5               // 5 or fewer times
   (_, e) => e.status === 503  // on a specific error
   ```

   Note: Although this function is basically function asking for true/false,
   it is possible to execute other logic, including side effects.
   This could be any sort of "extra" logic to prepare for a retry.

-  `delay` is how long to wait before retrying. By default, there is no delay. The value of delay is either a number (milliseconds) or a function. 
The function will receive the call count and exception thrown. Exponential backoff looks like `(c) => Math.pow(2, c) * 1000`. It's possible that the exception would be useful: the exception saying a server is busy may suggest a longer timeout than some intermittent exception.

## Sync

This module assumes that the function will return a promise, as this will be 90% (or more) of the use cases. If you want to retry synchronous code, use `retryableSync` instead. It does *not* support any sort of delay, and `shouldRetry` should be sync as well. Failure for sync functions means throwing an exception, (and
failure for Promise/async functions means returning a rejected promise).


## Other Libs

Lots of these solutions are (1) not Typescript (2) function specific, such as `fetch` only. Feel free to try any of them.

- very similar: https://www.npmjs.com/package/as-retryable-promise
- https://github.com/jonbern/fetch-retry nice version
- https://www.chrisarmstrong.dev/posts/retry-timeout-and-cancel-with-fetch
- https://github.com/poetic/retryable-promise
- https://github.com/valeriangalliat/promise-retryable
- https://www.npmjs.com/package/keep-trying
