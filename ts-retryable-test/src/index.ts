import {retryable} from 'ts-retryable'
import {retryableSync} from "ts-retryable/dist/retryableSync";


async function helloAsync() {
  await console.log('hello async')
}

const helloAsyncRetryable = retryable(helloAsync, {shouldRetry: (count) => count == 1})

helloAsyncRetryable()


const flaky = () => new Promise((resolve, reject) => {
  const v = Math.random() < .05;
  console.log(v ? 'success' : 'failure')
  if (v)
    resolve('success')
  else
    reject('failure')
})

const lessFlaky = retryable(flaky, {shouldRetry: () => true})

console.log('try flaky function')
await lessFlaky()
console.log('success with flaky function')


function flakySync() {
  const v = Math.random() < 0.05;
  console.log(v ? 'success' : 'failure')
  if (!v) throw "oh no!"
}

const lessFlakySync = retryableSync(flakySync, {shouldRetry: () => true})

console.log('try flaky sync function')
lessFlakySync()
console.log('success with flaky sync function')
