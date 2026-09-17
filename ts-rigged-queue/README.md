# ts-rigged-queue

A bounded queue with two groups:

- **Pinned items** stay at the front and are never evicted.
- The **pool** holds evictable items. New items are added at its front; when the queue exceeds `maxSize`, least-recently-used pool items are evicted.

Why use it? Because sometimes you want a small, hot list where a few entries should stay visible no matter what, while everything else behaves like a capped cache. This is ideal for “featured items + recent items,” “sticky tabs + active sessions,” or “pinned documents + working set.”

## Installation

```sh
npm install ts-rigged-queue
```

## Usage

```ts
import {RiggedQueue} from 'ts-rigged-queue'
```

```ts
const queue = new RiggedQueue(3, ['pinned'], ['a', 'b'])
queue.add('c')
queue.use('a')

queue.snapshot() // ['pinned', 'c', 'a']
```

Use `onChange()` to observe effective mutations. The event contains visible additions, removals, and the current snapshot; pinning and unpinning also emit events even when the visible order is unchanged. The returned unsubscribe function removes the listener. `snapshot()` preserves its cached array identity; the returned snapshot is frozen and cannot be mutated.

## Collection API

```ts
queue.size       // visible pinned items plus pool entries
queue.has(item)  // true only for visible entries
queue.remove(item) // removes the item entirely

for (const item of queue) {
  use(item)
}
```

`values()` provides the same iteration order as `snapshot()`. Pool entries evicted by the size cap are no longer visible and therefore return `false` from `has()`.

## Pinning and unpinning

```ts
const queue = new RiggedQueue(4, ['always-show'], ['old-1', 'old-2'])

queue.pin('featured')
queue.unpin('featured')
queue.remove('featured')
```

`pin()` promotes an existing pool item into the pinned set without removing it. `unpin()` demotes it back into the pool, where it becomes eligible for eviction again. `remove()` is the destructive option: the item is deleted from the queue entirely.

## Prioritizing items

```ts
const queue = new RiggedQueue(4, ['always-show'], ['old-1', 'old-2'])

queue.add('recent')
queue.add('most-recent', 'next')

queue.snapshot()
// ['always-show', 'most-recent', 'next', 'recent']
```

## Usage affects eviction

```ts
const queue = new RiggedQueue(3, [], ['a', 'b', 'c'])
queue.use('a')
queue.add('d')

queue.snapshot()
// ['d', 'a', 'b'] — the least-recently-used item is evicted
```

## Observing changes

```ts
const queue = new RiggedQueue(2, [], ['a'])
const stop = queue.onChange(event => {
  console.log('added:', event.added)
  console.log('removed:', event.removed)
  console.log('current:', event.items)
})

queue.add('b')
stop()
```

## Pinned-item lifecycle

```ts
queue.pin('featured')  // promote an existing pool item
queue.unpin('featured') // demote it back into the pool
queue.remove('featured') // remove it entirely, including its pinned status
```

`pin()` and `unpin()` are the API names you want for the conceptual model.

## Pinned items exceeding the cap

Pinned items are retained even when their count exceeds `maxSize`; pool items are evicted first.

```ts
const queue = new RiggedQueue(1, ['a', 'b'], ['c'])
queue.snapshot() // ['a', 'b']
```
