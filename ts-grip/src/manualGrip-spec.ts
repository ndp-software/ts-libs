import {describe, it as spec} from "node:test";
import assert from "node:assert/strict";
import {manualGrip} from "./manualGrip";

describe('manualGrip', () => {
  spec('can apply arbitrary getters and setters', () => {
    let val = 7
    const grip = manualGrip(
      () => val,
      (v: number) => val = v
    )

    assert.equal(grip.value, 7)

    grip.set(8)

    assert.equal(grip.value, 8)
    assert.equal(val, 8)
  })



  spec('can apply async getters and setters', async () => {
    let val = 7
    const grip = manualGrip(
      () => Promise.resolve(val),
      (v: Promise<number>) => {
        return v.then(value => val = value)
      }
    )

    assert.equal(await grip.value, 7)

    await grip.set(Promise.resolve(8))

    assert.equal(await grip.value, 8)
    assert.equal(val, 8)
  })


})
