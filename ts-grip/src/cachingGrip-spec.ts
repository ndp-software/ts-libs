import {describe, it as spec} from "node:test";
import assert from "node:assert/strict";
import {manualGrip} from "./manualGrip";
import {cachingGrip} from "./cachingGrip";
import {valueGrip} from "./valueGrip";

describe('cachingGrip', () => {

  spec('should cache the value after the first retrieval (sync)', () => {
    const grip = valueGrip(0);
    const caching = cachingGrip(grip);

    assert.equal(caching.value, 0);

    caching.set(2);
    assert.equal(caching.value, 2); // Should update and return new value
    assert.equal(grip.value, 2) // Should update target
  });

  spec('should cache the value after the first retrieval (async)', async () => {
    let value = 0;
    const grip = manualGrip(
      () => Promise.resolve(value),
      (v: Promise<number>) => {
        return v.then(val => value = val);
      }
    );
    const caching = cachingGrip(grip);

    assert.equal(await caching.value, 0);

    value = 1;
    assert.equal(await caching.value, 0); // Should still return cached value
    caching.expire()
    assert.equal(await caching.value, 1)

    await caching.set(Promise.resolve(2));
    assert.equal(await caching.value, 2); // Should update and return new value
    assert.equal(await grip.value, 2);
  });

  spec('should expire explicitly', () => {
    const grip = valueGrip(0);
    const caching = cachingGrip(grip);

    assert.equal(caching.value, 0);

    grip.set(1);  // WRONG usage, cachingGrip doesn't know
    assert.equal(caching.value, 0); // Should still return cached value

    caching.expire()
    assert.equal(caching.value, 1)
  })

  spec('should expire automatically if observable', () => {
    const grip = valueGrip(0).observable
    const caching = cachingGrip(grip)

    assert.equal(caching.value, 0)

    grip.set(1) // not telling the cachingGrip

    assert.equal(caching.value, 1) // ...but it knows.
  })

});
