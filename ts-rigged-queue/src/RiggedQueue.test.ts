import {describe, test} from 'node:test'
import assert from 'node:assert/strict'
import {RiggedQueue} from './RiggedQueue.ts'

describe('RiggedQueue', () => {

  // --- snapshot() ordering ---

  test('snapshot() returns pinned items first, then pool items', () => {
    const q = new RiggedQueue(5, ['w1', 'w2'], ['a', 'b', 'c'])
    assert.deepEqual(q.snapshot(), ['w1', 'w2', 'a', 'b', 'c'])
  })

  test('snapshot() pinned items appear in Set insertion order', () => {
    const q = new RiggedQueue(10, ['z', 'a', 'm'])
    assert.deepEqual(q.snapshot(), ['z', 'a', 'm'])
  })

  test('snapshot() result is capped at maxSize (pool truncated)', () => {
    const q = new RiggedQueue(3, ['w1'], ['a', 'b', 'c', 'd'])
    assert.deepEqual(q.snapshot(), ['w1', 'a', 'b'])
  })

  test('snapshot() cap: pinned items always included even when count exceeds maxSize', () => {
    const q = new RiggedQueue(2, ['w1', 'w2', 'w3'], ['a', 'b'])
    // all 3 pinned items included despite maxSize=2; no pool items fit
    assert.deepEqual(q.snapshot(), ['w1', 'w2', 'w3'])
  })

  test('snapshot() with an empty pool returns only pinned items', () => {
    const q = new RiggedQueue(5, ['w1', 'w2'])
    assert.deepEqual(q.snapshot(), ['w1', 'w2'])
  })

  test('snapshot() with no pinned items returns pool items up to cap', () => {
    const q = new RiggedQueue(2, [], ['a', 'b', 'c'])
    assert.deepEqual(q.snapshot(), ['a', 'b'])
  })

  test('snapshot() skips pool items already in pinned items', () => {
    // 'w1' appears in both pinned items and the pool; calculateItems guards with includes()
    const q = new RiggedQueue(5, ['w1'], ['w1', 'a', 'b'])
    assert.deepEqual(q.snapshot(), ['w1', 'a', 'b'])
  })

  test('snapshot() result is cached (same array reference on repeated calls)', () => {
    const q = new RiggedQueue(5, ['w1'], ['a'])
    assert.equal(q.snapshot(), q.snapshot())
  })

  test('size and has() describe the visible queue', () => {
    const q = new RiggedQueue(2, ['w1'], ['a', 'b'])
    assert.equal(q.size, 2)
    assert.equal(q.has('w1'), true)
    assert.equal(q.has('a'), true)
    assert.equal(q.has('b'), false)
    assert.equal(q.has('missing'), false)
  })

  test('values() and iteration follow snapshot() order', () => {
    const q = new RiggedQueue(5, ['w1'], ['a', 'b'])
    assert.deepEqual([...q.values()], ['w1', 'a', 'b'])
    assert.deepEqual([...q], ['w1', 'a', 'b'])
  })

  // --- add() ---

  test('add() inserts a new item at the front of the pool', () => {
    const q = new RiggedQueue(5, [], ['b', 'c'])
    q.add('a')
    assert.deepEqual(q.snapshot(), ['a', 'b', 'c'])
  })

  test('add(a, b, c) places items in a, b, c order at front', () => {
    const q = new RiggedQueue(10, [], ['x'])
    q.add('a', 'b', 'c')
    assert.deepEqual(q.snapshot(), ['a', 'b', 'c', 'x'])
  })

  test('add() does not move an existing pool item to the front', () => {
    const q = new RiggedQueue(5, [], ['a', 'b', 'c'])
    q.add('b') // 'b' already present
    assert.deepEqual(q.snapshot(), ['a', 'b', 'c'])
  })

  test('add() silently ignores pinned items', () => {
    const q = new RiggedQueue(5, ['w1'], ['a'])
    q.add('w1')
    assert.deepEqual(q.snapshot(), ['w1', 'a'])
  })

  test('add() invalidates the snapshot() cache', () => {
    const q = new RiggedQueue(5, [], ['a', 'b'])
    const before = q.snapshot()
    q.add('c')
    const after = q.snapshot()
    // assert.notEqual(before, after)
    assert.deepEqual(after, ['c', 'a', 'b'])
  })

  test('remove() removes pool and pinned items', () => {
    const q = new RiggedQueue(5, ['w1'], ['a', 'b'])
    assert.equal(q.remove('a'), true)
    assert.deepEqual(q.snapshot(), ['w1', 'b'])
    assert.equal(q.remove('w1'), true)
    assert.deepEqual(q.snapshot(), ['b'])
    assert.equal(q.remove('missing'), false)
  })

  // --- pin() and unpin() ---

  test('pin() keeps an item in the list where it is', () => {
    const q = new RiggedQueue(5, ['w1'], ['a', 'b', 'c','d'])
    q.pin('b', 'd')
    assert.deepEqual(q.snapshot(), ['w1', 'a', 'b', 'c', 'd'])
    q.add('e')
    assert.deepEqual(q.snapshot(), ['w1', 'a', 'b', 'e', 'd'])
  })

  test('pin() of non-member added at end of pinned list', () => {
    const q = new RiggedQueue(5, ['w1'], ['a', 'b'])
    q.pin('w2')
    assert.deepEqual(q.snapshot(), ['w1', 'w2', 'a', 'b'])
  })

  test('pin() of non-member notifies of change', () => {
    const q = new RiggedQueue(5, ['w1'], ['a', 'b'])
    const events: { added: string[], removed: string[] }[] = []
    q.onChange(e => events.push({ added: [...e.added], removed: [...e.removed] }))
    q.pin('w2')
    assert.equal(events.length, 1)
    assert.deepEqual(events[0].added, ['w2'])
    assert.deepEqual(events[0].removed, [])
  })

  test('unpin() leaves pinned item in list if it still fits', () => {
    const q = new RiggedQueue(5, ['w1', 'w2'], ['a', 'b'])
    q.unpin('w1')
    assert.deepEqual(q.snapshot(), ['w1', 'w2', 'a', 'b'])
    q.add('c') // add a pool item to fill cap
    assert.deepEqual(q.snapshot(), ['c', 'w1', 'w2', 'a', 'b']) // w1 still fits, so still in list
    q.add('d') // add another pool item to exceed cap
    assert.deepEqual(q.snapshot(),  [ 'd', 'c', 'w1', 'w2', 'a' ])
    q.add('e')
    assert.deepEqual(q.snapshot(),  [ 'e', 'd', 'c', 'w1', 'w2' ])
   q.add('f')
    assert.deepEqual(q.snapshot(),  [ 'f', 'e', 'd', 'c', 'w2' ])

  })

  // --- cap enforcement after add() ---

  test('newly added items respect maxSize cap in snapshot()', () => {
    const q = new RiggedQueue(3, ['w1'], ['a', 'b'])
    // already at cap: w1 + a + b = 3
    q.add('c')
    // 'c' is at the front of the pool but 'b' is now beyond the cap
    assert.deepEqual(q.snapshot(), ['w1', 'c', 'a'])
  })

  // --- use() ---

  test('use() does not throw and does not change snapshot() ordering', () => {
    const q = new RiggedQueue(5, ['w1'], ['a', 'b'])
    const before = q.snapshot().slice()
    q.use('a')
    assert.deepEqual(q.snapshot(), before)
  })

  test('use() does not affect snapshot() cache reference', () => {
    const q = new RiggedQueue(5, [], ['a', 'b'])
    const ref = q.snapshot()
    q.use('a')
    // use() doesn't null out items, so cache is still the same object
    assert.equal(q.snapshot(), ref)
  })

  test('snapshot() cannot be mutated by callers', () => {
    const q = new RiggedQueue(5, [], ['a', 'b'])
    const snapshot = q.snapshot()
    assert.throws(() => snapshot.push('c'), TypeError)
    assert.deepEqual(q.snapshot(), ['a', 'b'])
  })

  test('snapshot() does not log during normal use', () => {
    const originalLog = console.log
    let calls = 0
    console.log = () => { calls++ }
    try {
      const q = new RiggedQueue(5, [], ['a'])
      q.snapshot()
      q.snapshot()
      assert.equal(calls, 0)
    } finally {
      console.log = originalLog
    }
  })

  // --- constructor pool ---

  test('constructor pool pre-populates queue', () => {
    const q = new RiggedQueue(10, [], ['x', 'y', 'z'])
    assert.deepEqual(q.snapshot(), ['x', 'y', 'z'])
  })

  test('constructor with no third arg defaults to an empty pool', () => {
    const q = new RiggedQueue(5, ['w1'])
    assert.deepEqual(q.snapshot(), ['w1'])
  })

  test('supports one-shot pinned-item iterables', () => {
    function* pinnedItems() {
      yield 'w1'
      yield 'w2'
    }
    const q = new RiggedQueue(5, pinnedItems(), ['a'])
    assert.deepEqual(q.snapshot(), ['w1', 'w2', 'a'])
  })

  // --- onChange() listeners ---

  test('onChange() listener fires after add() with correct added/removed/items', () => {
    const q = new RiggedQueue(5, [], ['a', 'b'])
    const events: { added: string[], removed: string[], items: string[] }[] = []
    q.onChange(e => events.push({ added: [...e.added], removed: [...e.removed], items: [...e.items] }))
    q.add('c')
    assert.equal(events.length, 1)
    assert.deepEqual(events[0].added, ['c'])
    assert.deepEqual(events[0].removed, [])
    assert.deepEqual(events[0].items, ['c', 'a', 'b'])
  })

  test('onChange() fires once per add() call, even when multiple items passed', () => {
    const q = new RiggedQueue<string>(10, [], [])
    let callCount = 0
    q.onChange(() => { callCount++ })
    q.add('x', 'y', 'z')
    assert.equal(callCount, 1)
  })

  test('onChange() reports explicit removals', () => {
    const q = new RiggedQueue(5, ['w1'], ['a'])
    const events: { added: string[], removed: string[], items: string[] }[] = []
    q.onChange(e => events.push({ added: [...e.added], removed: [...e.removed], items: [...e.items] }))

    q.remove('a')
    q.remove('w1')

    assert.deepEqual(events, [
      { added: [], removed: ['a'], items: ['w1'] },
      { added: [], removed: ['w1'], items: [] }
    ])
  })

  test('onChange() reports pinned-item demotion even when visible order is unchanged', () => {
    const q = new RiggedQueue(5, ['w1'], ['a'])
    const events: { added: string[], removed: string[], items: string[] }[] = []
    q.onChange(e => events.push({ added: [...e.added], removed: [...e.removed], items: [...e.items] }))

    q.unpin('w1')

    assert.deepEqual(events, [{ added: [], removed: [], items: ['w1', 'a'] }])
  })

  test('onChange() reports pinned-item promotion even when visible order is unchanged', () => {
    const q = new RiggedQueue(5, ['w1'], ['a'])
    const events: { added: string[], removed: string[], items: string[] }[] = []
    q.onChange(e => events.push({ added: [...e.added], removed: [...e.removed], items: [...e.items] }))

    q.pin('a')

    assert.deepEqual(events, [{ added: [], removed: [], items: ['w1', 'a'] }])
  })

  test('onChange() reports removed items when cap is exceeded', () => {
    const q = new RiggedQueue(3, ['w1'], ['a', 'b'])
    // snapshot is currently: w1, a, b (at cap)
    const events: { added: string[], removed: string[] }[] = []
    q.onChange(e => events.push({ added: [...e.added], removed: [...e.removed] }))
    q.add('c')
    assert.equal(events.length, 1)
    assert.deepEqual(events[0].added, ['c'])
    assert.deepEqual(events[0].removed, ['b'])
  })

  test('onChange() does NOT fire when add() changes nothing in snapshot()', () => {
    const q = new RiggedQueue(5, [], ['a', 'b', 'c'])
    let callCount = 0
    q.onChange(() => { callCount++ })
    q.add('a') // 'a' is already in the pool, so snapshot() is unchanged
    assert.equal(callCount, 0)
  })

  test('onChange() does NOT fire when adding a pinned item (no change to snapshot)', () => {
    const q = new RiggedQueue(5, ['w1'], ['a'])
    let callCount = 0
    q.onChange(() => { callCount++ })
    q.add('w1')
    assert.equal(callCount, 0)
  })

  test('onChange() unsubscribe stops future notifications', () => {
    const q = new RiggedQueue<string>(5, [], [])
    let callCount = 0
    const unsub = q.onChange(() => { callCount++ })
    q.add('a')
    assert.equal(callCount, 1)
    unsub()
    q.add('b')
    assert.equal(callCount, 1)
  })

  test('onChange() multiple listeners all receive the same event', () => {
    const q = new RiggedQueue<string>(5, [], [])
    const results: string[][] = []
    q.onChange(e => results.push(['L1', ...e.added]))
    q.onChange(e => results.push(['L2', ...e.added]))
    q.add('x')
    assert.equal(results.length, 2)
    assert.deepEqual(results[0], ['L1', 'x'])
    assert.deepEqual(results[1], ['L2', 'x'])
  })

  test('onChange() listener error does not prevent other listeners from firing', () => {
    const q = new RiggedQueue<string>(5, [], [])
    let secondCalled = false
    q.onChange(() => { throw new Error('boom') })
    q.onChange(() => { secondCalled = true })
    q.add('x')
    assert.equal(secondCalled, true)
  })
})
