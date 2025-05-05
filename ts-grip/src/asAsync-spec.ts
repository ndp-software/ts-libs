/**
 * You might have an async grip that needs to somehow work
 * with a non-promise grip. Use this.
 */
import {describe, it as spec, mock} from "node:test";
import assert from "node:assert/strict";
import {valueGrip} from "./valueGrip";
import {asAsync} from "./asAsync";


describe('asAsync', () => {
  spec('should convert a non-promise grip to a promise grip', async () => {
    const grip = valueGrip(42)
    const asyncGrip = asAsync(grip)

    assert.equal(await asyncGrip.value, 42);

    asyncGrip.set(Promise.resolve(43));

    assert.equal(await asyncGrip.value, 43);
    assert.equal(grip.value, 43);
  });

  spec('should notify of changes', async () => {
    const grip = valueGrip(42).observable
    const gripObserver = mock.fn()
    grip.addObserver(gripObserver)


    const asyncGrip = asAsync(grip)

    assert.equal(await asyncGrip.value, 42);

    asyncGrip.set(Promise.resolve(43));

    assert.equal(gripObserver.mock.calls.length, 0)

    await asyncGrip.value

    assert.equal(gripObserver.mock.calls.length, 1)
    assert.deepEqual(gripObserver.mock.calls[0].arguments, [43, 42])
  })

})
